import prisma from "../config/prisma.js";
import { OrderStatus } from "../generated/prisma/enums.ts";
import { failCheckoutSession, fulfilCheckoutSession, markOrderRefunded } from "../services/order.service.js";
import { constructWebhookEvent, getStripe, toMinorUnits } from "../services/stripe.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { loadCart } from "./cart.controller.js";

const CHECKOUT_WINDOW_MINUTES = 31; // Stripe requires at least 30

// POST /payments/checkout — turns the cart into a PENDING order and opens a Stripe Checkout Session.
// Every amount is recomputed here from the Package rows; nothing price-related is read from the request.
export const createCheckout = asyncHandler(async (req, res) => {
    const stripe = getStripe();

    const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: { include: { package: true }, orderBy: { id: "asc" } } },
    });
    const items = cart?.items ?? [];
    if (!items.length) throw ApiError.badRequest("Your cart is empty");
    if (items.some((item) => !item.package.isActive)) throw ApiError.badRequest("Remove unavailable packages from your cart first");

    const currency = items[0].package.currency;
    if (items.some((item) => item.package.currency !== currency)) throw ApiError.badRequest("All packages in one order must use the same currency");

    const totalMinor = items.reduce((sum, item) => sum + toMinorUnits(item.package.amount) * item.quantity, 0);

    const order = await prisma.order.create({
        data: {
            userId: req.user.id,
            total: totalMinor / 100,
            currency,
            items: {
                create: items.map((item) => ({
                    packageId: item.packageId,
                    quantity: item.quantity,
                    unitPrice: item.package.amount,
                    adCredits: item.package.adCount * item.quantity,
                    featuredDays: item.package.featuredDays,
                    durationDays: item.package.durationUnit === "MONTH" ? item.package.durationValue * 30 : item.package.durationValue,
                })),
            },
        },
    });

    try {
        const session = await stripe.checkout.sessions.create(
            {
                mode: "payment",
                client_reference_id: order.id,
                customer_email: req.user.email,
                metadata: { orderId: order.id, userId: req.user.id },
                line_items: items.map((item) => ({
                    quantity: item.quantity,
                    price_data: {
                        currency: currency.toLowerCase(),
                        unit_amount: toMinorUnits(item.package.amount),
                        product_data: { name: item.package.name },
                    },
                })),
                expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_WINDOW_MINUTES * 60,
                success_url: `${process.env.CORS_ORIGIN}/checkout/success?order=${order.id}`,
                cancel_url: `${process.env.CORS_ORIGIN}/cart`,
            },
            { idempotencyKey: `order-${order.id}` },
        );
        await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
        return apiResponse(res, 201, true, "Checkout created", { orderId: order.id, url: session.url });
    } catch (error) {
        console.error(`Stripe checkout for order ${order.id} failed: ${error.message}`);
        await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.FAILED } });
        throw new ApiError("The payment provider is unavailable. Please try again shortly.", 502);
    }
});

// POST /payments/confirm { orderId } — the success page calls this so credits appear even if the webhook is late.
// The state comes from Stripe itself (never from the client) and fulfilment is idempotent.
export const confirmOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({ where: { id: String(req.body?.orderId ?? ""), userId: req.user.id } });
    if (!order) throw ApiError.notFound("Order not found");

    if (order.status === OrderStatus.PENDING && order.stripeSessionId) {
        const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") await fulfilCheckoutSession(session);
        else if (session.status === "expired") await failCheckoutSession(session);
    }
    const fresh = await prisma.order.findUnique({ where: { id: order.id }, select: { id: true, status: true, total: true, currency: true, paidAt: true } });
    return apiResponse(res, 200, true, "Order status", { ...fresh, cart: await loadCart(req.user.id) });
});

// POST /payments/webhook — mounted with a raw body parser. The signature is the only authentication.
export const stripeWebhook = asyncHandler(async (req, res) => {
    let event;
    try {
        event = constructWebhookEvent(req.body, req.headers["stripe-signature"]);
    } catch (error) {
        if (error.statusCode === 503) throw error;
        throw ApiError.badRequest("Invalid webhook signature");
    }

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        await fulfilCheckoutSession(event.data.object);
    } else if (event.type === "charge.refunded") {
        const charge = event.data.object;
        // Only full refunds withdraw credits; a partial refund is left for a human to sort out.
        if (charge.refunded && typeof charge.payment_intent === "string") await markOrderRefunded({ paymentIntentId: charge.payment_intent });
        else console.warn(`Partial refund on charge ${charge.id}: no credits changed`);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        await failCheckoutSession(event.data.object);
    }
    return res.status(200).json({ received: true });
});
