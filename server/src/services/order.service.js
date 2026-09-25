import prisma from "../config/prisma.js";
import { OrderStatus } from "../generated/prisma/enums.ts";
import { CreditSource, grantCredits } from "./credit.service.js";
import { sendPurchaseEmail } from "./email.service.js";
import { getStripe, toMinorUnits } from "./stripe.service.js";
import { ApiError } from "../utils/error.js";

/**
 * Marks an order PAID from a Stripe Checkout Session and grants the purchased ad credits.
 * The session is trusted only after it matches the order we created (id, amount, currency), and the
 * PENDING -> PAID switch is a single conditional update, so webhook retries or a webhook racing the
 * confirm endpoint can never grant credits twice.
 * Returns "fulfilled" | "already-processed" | "ignored".
 */
export const fulfilCheckoutSession = async (session) => {
    const orderId = session?.metadata?.orderId;
    if (!orderId || session.payment_status !== "paid") return "ignored";

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: true } });
    if (!order || order.stripeSessionId !== session.id) return "ignored";

    if (session.amount_total !== toMinorUnits(order.total) || session.currency?.toUpperCase() !== order.currency) {
        console.error(`Stripe session ${session.id} does not match order ${order.id}; not fulfilled`);
        return "ignored";
    }

    const claimed = await prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
            where: { id: order.id, status: OrderStatus.PENDING },
            data: {
                status: OrderStatus.PAID,
                paidAt: new Date(),
                stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
                stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            },
        });
        if (!result.count) return false;

        for (const item of order.items) {
            await grantCredits(tx, {
                userId: order.userId,
                credits: item.adCredits,
                source: CreditSource.PURCHASE,
                orderItemId: item.id,
                featuredDays: item.featuredDays,
                durationDays: item.durationDays,
            });
        }
        await tx.cartItem.deleteMany({ where: { cartId: order.userId } });
        return true;
    });
    if (!claimed) return "already-processed";

    sendPurchaseEmail(order.user, order).catch((error) => console.error(`Purchase email failed: ${error.message}`));
    return "fulfilled";
};

/** A checkout that expired unpaid can never complete. */
export const failCheckoutSession = async (session) => {
    const orderId = session?.metadata?.orderId;
    if (!orderId) return;
    await prisma.order.updateMany({ where: { id: orderId, stripeSessionId: session.id, status: OrderStatus.PENDING }, data: { status: OrderStatus.FAILED } });
};

/**
 * PAID -> REFUNDED. Unused credits from this order are withdrawn; credits already spent on published ads stay
 * spent (those ads keep running). Conditional on PAID, so a refund initiated here and the `charge.refunded`
 * webhook that follows it cannot both apply. Returns null if the order was not PAID.
 */
export const markOrderRefunded = async ({ orderId, paymentIntentId }, refundId = null) => {
    const where = orderId ? { id: orderId } : { stripePaymentIntentId: paymentIntentId };
    const order = await prisma.order.findFirst({ where, include: { items: { select: { id: true } } } });
    if (!order) return null;

    return prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
            where: { id: order.id, status: OrderStatus.PAID },
            data: { status: OrderStatus.REFUNDED, refundedAt: new Date(), stripeRefundId: refundId },
        });
        if (!result.count) return null;

        const lots = await tx.adCreditLot.findMany({ where: { orderItemId: { in: order.items.map((i) => i.id) } }, select: { granted: true, remaining: true } });
        await tx.adCreditLot.updateMany({ where: { orderItemId: { in: order.items.map((i) => i.id) } }, data: { remaining: 0 } });

        return {
            orderId: order.id,
            creditsWithdrawn: lots.reduce((sum, lot) => sum + lot.remaining, 0),
            creditsAlreadyUsed: lots.reduce((sum, lot) => sum + (lot.granted - lot.remaining), 0),
        };
    });
};

/** Full refund through Stripe, then the local state change. */
export const refundOrder = async (orderId, reason) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.status === OrderStatus.REFUNDED) throw ApiError.conflict("This order is already refunded");
    if (order.status !== OrderStatus.PAID || !order.stripePaymentIntentId) throw ApiError.badRequest("Only paid orders can be refunded");

    let refund;
    try {
        refund = await getStripe().refunds.create(
            { payment_intent: order.stripePaymentIntentId, reason: "requested_by_customer", metadata: { orderId: order.id, note: (reason ?? "").slice(0, 200) } },
            { idempotencyKey: `refund-${order.id}` },
        );
    } catch (error) {
        if (error.statusCode === 503) throw error;
        console.error(`Stripe refund for order ${order.id} failed: ${error.message}`);
        throw new ApiError(`Stripe could not refund this order: ${error.message}`, 502);
    }

    const result = (await markOrderRefunded({ orderId: order.id }, refund.id)) ?? { orderId: order.id, creditsWithdrawn: 0, creditsAlreadyUsed: 0 };
    return { ...result, refundId: refund.id };
};
