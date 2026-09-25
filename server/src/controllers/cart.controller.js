import prisma from "../config/prisma.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { toMinorUnits } from "../services/stripe.service.js";

const MAX_QUANTITY = 100;
const MAX_LINES = 20;

const itemInclude = {
    package: {
        select: {
            id: true, name: true, details: true, adCount: true, durationValue: true, durationUnit: true,
            amount: true, currency: true, featuredDays: true, isActive: true,
        },
    },
};

// The cart returned to the client. Prices always come from the current Package rows, never from the client.
export const loadCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: itemInclude, orderBy: { id: "asc" } } },
    });

    const items = (cart?.items ?? []).map(({ id, quantity, package: pkg }) => ({
        id,
        quantity,
        package: pkg,
        available: pkg.isActive,
        lineTotal: (toMinorUnits(pkg.amount) * quantity) / 100,
    }));
    const payable = items.filter((item) => item.available);
    return {
        items,
        currency: payable[0]?.package.currency ?? "AED",
        adCredits: payable.reduce((sum, item) => sum + item.package.adCount * item.quantity, 0),
        total: payable.reduce((sum, item) => sum + toMinorUnits(item.package.amount) * item.quantity, 0) / 100,
    };
};

const parseQuantity = (value) => {
    const quantity = Number(value ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw ApiError.badRequest(`quantity must be between 1 and ${MAX_QUANTITY}`);
    return quantity;
};

const parsePackageId = (value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw ApiError.badRequest("Invalid package id");
    return id;
};

// GET /cart
export const getCart = asyncHandler(async (req, res) => apiResponse(res, 200, true, "Cart", await loadCart(req.user.id)));

// POST /cart/items  { packageId, quantity } — sets the quantity for that package (adds it if new)
export const setCartItem = asyncHandler(async (req, res) => {
    const packageId = parsePackageId(req.body?.packageId);
    const quantity = parseQuantity(req.body?.quantity);

    const pkg = await prisma.package.findFirst({ where: { id: packageId, isActive: true }, select: { id: true } });
    if (!pkg) throw ApiError.notFound("Package not found");

    const cartId = req.user.id;
    await prisma.cart.upsert({ where: { userId: cartId }, update: {}, create: { userId: cartId } });

    const existing = await prisma.cartItem.findUnique({ where: { cartId_packageId: { cartId, packageId } } });
    if (!existing && (await prisma.cartItem.count({ where: { cartId } })) >= MAX_LINES) throw ApiError.badRequest(`A cart can hold at most ${MAX_LINES} different packages`);

    await prisma.cartItem.upsert({
        where: { cartId_packageId: { cartId, packageId } },
        update: { quantity },
        create: { cartId, packageId, quantity },
    });
    return apiResponse(res, 200, true, "Cart updated", await loadCart(req.user.id));
});

// DELETE /cart/items/:packageId
export const removeCartItem = asyncHandler(async (req, res) => {
    await prisma.cartItem.deleteMany({ where: { cartId: req.user.id, packageId: parsePackageId(req.params.packageId) } });
    return apiResponse(res, 200, true, "Cart updated", await loadCart(req.user.id));
});

// DELETE /cart
export const clearCart = asyncHandler(async (req, res) => {
    await prisma.cartItem.deleteMany({ where: { cartId: req.user.id } });
    return apiResponse(res, 200, true, "Cart cleared", await loadCart(req.user.id));
});
