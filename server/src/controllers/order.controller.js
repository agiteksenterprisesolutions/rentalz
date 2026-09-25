import prisma from "../config/prisma.js";
import { OrderStatus } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { getPagination, paginated } from "../utils/pagination.js";
import { audit } from "../services/audit.service.js";
import { refundOrder } from "../services/order.service.js";

const orderSelect = {
    id: true, status: true, total: true, currency: true, paidAt: true, createdAt: true,
    items: { select: { id: true, quantity: true, unitPrice: true, adCredits: true, package: { select: { id: true, name: true } } } },
};

const parseStatus = (value) => {
    if (!value) return undefined;
    const status = String(value).toUpperCase();
    if (!Object.values(OrderStatus).includes(status)) throw ApiError.badRequest("Invalid status");
    return status;
};

// GET /orders — the signed-in user's orders
export const myOrders = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const where = { userId: req.user.id, status: parseStatus(req.query.status) };
    const [items, total] = await Promise.all([
        prisma.order.findMany({ where, select: orderSelect, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
        prisma.order.count({ where }),
    ]);
    return apiResponse(res, 200, true, "Orders", paginated(items, total, pagination));
});

// GET /orders/all?status=&userId= — every order (order:list)
export const allOrders = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query, { defaultLimit: 20 });
    const where = { status: parseStatus(req.query.status), ...(req.query.userId && { userId: String(req.query.userId) }) };
    const [items, total] = await Promise.all([
        prisma.order.findMany({
            where,
            select: { ...orderSelect, user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
            skip: pagination.skip,
            take: pagination.take,
        }),
        prisma.order.count({ where }),
    ]);
    return apiResponse(res, 200, true, "Orders", paginated(items, total, pagination));
});

// GET /orders/:id — the owner, or staff with order:list
export const getOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { ...orderSelect, userId: true } });
    const canSeeAll = req.permissions?.has("order:list");
    if (!order || (order.userId !== req.user.id && !canSeeAll)) throw ApiError.notFound("Order not found");

    const { userId, ...rest } = order;
    return apiResponse(res, 200, true, "Order", rest);
});

// POST /orders/:id/refund  { reason? } — full refund through Stripe (order:refund).
// Unused credits from the order are withdrawn; credits already spent on published ads stay spent.
export const refund = asyncHandler(async (req, res) => {
    const reason = req.body?.reason ? String(req.body.reason).trim().slice(0, 200) : null;
    const result = await refundOrder(req.params.id, reason);
    await audit(req, "order:refund", "Order", req.params.id, { reason, ...result });
    return apiResponse(res, 200, true, "Order refunded", result);
});
