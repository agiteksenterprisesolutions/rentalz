import prisma from "../config/prisma.js";
import { AdStatus, CreditSource, OrderStatus, UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { approveAdById, rejectAdById, setFeatured } from "../services/ad-moderation.service.js";
import { audit } from "../services/audit.service.js";
import { getAdCredits, grantCredits } from "../services/credit.service.js";
import { readSettings, SETTINGS, writeSetting } from "../services/settings.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { getPagination, paginated } from "../utils/pagination.js";
import { hashPassword } from "../utils/helper.js";
import { parseFeatureBody, parseRejectReason } from "./ad.controller.js";

const DAY_MS = 86400000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const like = (value) => String(value).trim().slice(0, 100);
const requireEnum = (value, allowed, name) => {
    const upper = String(value ?? "").toUpperCase();
    if (!Object.values(allowed).includes(upper)) throw ApiError.badRequest(`Invalid ${name}`);
    return upper;
};

// ── dashboard ────────────────────────────────────────────────
// GET /admin/stats — counters for the dashboard. Sales figures need report:sales, ad figures report:ads.
export const stats = asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 30 * DAY_MS);
    const data = {};

    if (req.permissions.has("report:ads")) {
        const [adsByStatus, users, views, contactsUnread] = await Promise.all([
            prisma.ad.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
            prisma.user.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
            prisma.adEvent.count({ where: { type: "VIEW", createdAt: { gte: since } } }),
            prisma.contact.count({ where: { isRead: false } }),
        ]);
        const count = (rows, key, value) => rows.find((r) => r[key] === value)?._count ?? 0;
        data.ads = { ...Object.fromEntries(Object.values(AdStatus).map((s) => [s, count(adsByStatus, "status", s)])), total: adsByStatus.reduce((n, r) => n + r._count, 0) };
        data.users = { ...Object.fromEntries(Object.values(UserStatus).map((s) => [s, count(users, "status", s)])), total: users.reduce((n, r) => n + r._count, 0) };
        data.viewsLast30Days = views;
        data.contactsUnread = contactsUnread;
    }

    if (req.permissions.has("report:sales")) {
        const [paid, recent, refunded, pending] = await Promise.all([
            prisma.order.aggregate({ where: { status: OrderStatus.PAID }, _sum: { total: true }, _count: true }),
            prisma.order.aggregate({ where: { status: OrderStatus.PAID, paidAt: { gte: since } }, _sum: { total: true }, _count: true }),
            prisma.order.aggregate({ where: { status: OrderStatus.REFUNDED }, _sum: { total: true }, _count: true }),
            prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        ]);
        data.sales = {
            paidOrders: paid._count,
            revenue: Number(paid._sum.total ?? 0),
            paidOrdersLast30Days: recent._count,
            revenueLast30Days: Number(recent._sum.total ?? 0),
            refundedOrders: refunded._count,
            refundedAmount: Number(refunded._sum.total ?? 0),
            pendingOrders: pending,
        };
    }
    return apiResponse(res, 200, true, "Stats", data);
});

// GET /admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD — paid revenue per day (default: last 30 days)
export const salesReport = asyncHandler(async (req, res) => {
    const parse = (value, fallback) => {
        if (!value) return fallback;
        const date = new Date(`${value}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) throw ApiError.badRequest("Dates must look like 2026-01-31");
        return date;
    };
    const to = parse(req.query.to, new Date());
    const from = parse(req.query.from, new Date(to.getTime() - 30 * DAY_MS));
    if (from > to || to - from > 366 * DAY_MS) throw ApiError.badRequest("Choose a range of at most one year");

    const end = new Date(to.getTime() + DAY_MS);
    const rows = await prisma.$queryRaw`
        SELECT DATE(paidAt) AS day, COUNT(*) AS orders, SUM(total) AS revenue
        FROM \`Order\`
        WHERE status = 'PAID' AND paidAt >= ${from} AND paidAt < ${end}
        GROUP BY DATE(paidAt) ORDER BY day`;
    const days = rows.map((r) => ({ day: new Date(r.day).toISOString().slice(0, 10), orders: Number(r.orders), revenue: Number(r.revenue) }));
    return apiResponse(res, 200, true, "Sales report", { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), days, totalRevenue: days.reduce((s, d) => s + d.revenue, 0) });
});

// ── users ────────────────────────────────────────────────────
const userListSelect = { id: true, name: true, email: true, phone: true, role: true, status: true, emailVerified: true, createdAt: true };

// GET /admin/users?q=&role=&status=&page=&limit=
export const listUsers = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query, { defaultLimit: 20 });
    const where = { deletedAt: null };
    if (req.query.role) where.role = requireEnum(req.query.role, UserRole, "role");
    if (req.query.status) where.status = requireEnum(req.query.status, UserStatus, "status");
    if (req.query.q) where.OR = [{ name: { contains: like(req.query.q) } }, { email: { contains: like(req.query.q) } }];

    const [users, total] = await Promise.all([
        prisma.user.findMany({ where, select: userListSelect, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
        prisma.user.count({ where }),
    ]);
    const credits = await prisma.adCreditLot.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) } }, _sum: { remaining: true } });
    const creditsById = new Map(credits.map((c) => [c.userId, c._sum.remaining ?? 0]));
    const items = users.map((u) => ({ ...u, adCredits: creditsById.get(u.id) ?? 0 }));
    return apiResponse(res, 200, true, "Users", paginated(items, total, pagination));
});

// GET /admin/users/:id
export const getUser = asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({
        where: { id: req.params.id, deletedAt: null },
        select: { ...userListSelect, provider: true, updatedAt: true, profile: { select: { firstName: true, lastName: true, aboutMe: true, organizationName: true, birthday: true, gender: true } } },
    });
    if (!user) throw ApiError.notFound("User not found");

    const [ads, orders, lots, adCredits] = await Promise.all([
        prisma.ad.groupBy({ by: ["status"], where: { userId: user.id, deletedAt: null }, _count: true }),
        prisma.order.aggregate({ where: { userId: user.id, status: OrderStatus.PAID }, _sum: { total: true }, _count: true }),
        prisma.adCreditLot.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
        getAdCredits(user.id),
    ]);
    return apiResponse(res, 200, true, "User", {
        ...user,
        adCredits,
        ads: Object.fromEntries(ads.map((r) => [r.status, r._count])),
        paidOrders: orders._count,
        totalSpent: Number(orders._sum.total ?? 0),
        creditLots: lots,
    });
});

const loadManagedUser = async (req) => {
    if (req.params.id === req.user.id) throw ApiError.badRequest("You cannot do this to your own account");
    const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!user) throw ApiError.notFound("User not found");
    return user;
};

// POST /admin/users  { name, email, password, phone?, role? } — creates an account that is active and verified at once
// (the admin vouches for the address). Only staff who may change roles can create a MODERATOR or ADMIN.
export const createUser = asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const phone = String(req.body?.phone ?? "").trim() || null;
    const role = req.body?.role ? requireEnum(req.body.role, UserRole, "role") : UserRole.USER;

    if (!name || name.length > 191) throw ApiError.badRequest("Name is required (max 191 characters)");
    if (!EMAIL_RE.test(email) || email.length > 191) throw ApiError.badRequest("A valid email is required");
    if (password.length < 8) throw ApiError.badRequest("Password must be at least 8 characters long");
    if (phone && !/^\+?[0-9\s-]{6,20}$/.test(phone)) throw ApiError.badRequest("Invalid phone number");
    if (role !== UserRole.USER && !req.permissions.has("user:change-role")) throw ApiError.forbidden("You cannot create staff accounts");

    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        throw ApiError.conflict("An account with this email already exists (it may be a deleted account)");
    }

    const user = await prisma.user.create({
        data: { name, email, phone, passwordHash: await hashPassword(password), role, status: UserStatus.ACTIVE, emailVerified: true, profile: { create: {} } },
        select: { id: true, name: true, email: true, phone: true, role: true, status: true, emailVerified: true, createdAt: true },
    });
    await audit(req, "user:create", "User", user.id, { role });
    return apiResponse(res, 201, true, "User created", user);
});

// PATCH /admin/users/:id/status  { status: "ACTIVE" | "BLOCKED" } — blocking also ends every session
export const setUserStatus = asyncHandler(async (req, res) => {
    const target = await loadManagedUser(req);
    const status = requireEnum(req.body?.status, { ACTIVE: "ACTIVE", BLOCKED: "BLOCKED" }, "status");

    const next = status === "ACTIVE" && !target.emailVerified ? UserStatus.PENDING : status;
    await prisma.$transaction([
        prisma.user.update({ where: { id: target.id }, data: { status: next } }),
        ...(status === "BLOCKED" ? [prisma.refreshToken.deleteMany({ where: { userId: target.id } })] : []),
    ]);
    await audit(req, status === "BLOCKED" ? "user:block" : "user:unblock", "User", target.id);
    return apiResponse(res, 200, true, status === "BLOCKED" ? "User blocked" : "User unblocked", { status: next });
});

// PATCH /admin/users/:id/role  { role }
export const setUserRole = asyncHandler(async (req, res) => {
    const target = await loadManagedUser(req);
    const role = requireEnum(req.body?.role, UserRole, "role");

    await prisma.$transaction([
        prisma.user.update({ where: { id: target.id }, data: { role } }),
        prisma.refreshToken.deleteMany({ where: { userId: target.id } }), // sign in again with the new role
    ]);
    await audit(req, "user:change-role", "User", target.id, { from: target.role, to: role });
    return apiResponse(res, 200, true, "Role updated", { role });
});

// DELETE /admin/users/:id — soft delete; their sessions end and their ads leave the site
export const deleteUser = asyncHandler(async (req, res) => {
    const target = await loadManagedUser(req);
    const now = new Date();
    await prisma.$transaction([
        prisma.user.update({ where: { id: target.id }, data: { deletedAt: now, status: UserStatus.INACTIVE } }),
        prisma.refreshToken.deleteMany({ where: { userId: target.id } }),
        prisma.emailChangeRequest.deleteMany({ where: { userId: target.id } }),
        prisma.ad.updateMany({ where: { userId: target.id, deletedAt: null }, data: { deletedAt: now } }),
    ]);
    await audit(req, "user:delete", "User", target.id);
    return apiResponse(res, 200, true, "User deleted");
});

// POST /admin/users/:id/credits  { credits, featuredDays?, durationDays?, note? } — support / goodwill grants
export const grantUserCredits = asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null }, select: { id: true } });
    if (!user) throw ApiError.notFound("User not found");

    const whole = (value, name, { min, max, fallback }) => {
        const n = value === undefined || value === "" ? fallback : Number(value);
        if (!Number.isInteger(n) || n < min || n > max) throw ApiError.badRequest(`${name} must be a whole number between ${min} and ${max}`);
        return n;
    };
    const credits = whole(req.body?.credits, "credits", { min: 1, max: 1000, fallback: NaN });
    const featuredDays = whole(req.body?.featuredDays, "featuredDays", { min: 0, max: 3650, fallback: 0 });
    const durationDays = whole(req.body?.durationDays, "durationDays", { min: 1, max: 3650, fallback: 30 });

    await grantCredits(prisma, { userId: user.id, credits, source: CreditSource.ADMIN, featuredDays, durationDays });
    await audit(req, "user:grant-credits", "User", user.id, { credits, featuredDays, durationDays, note: String(req.body?.note ?? "").slice(0, 200) || null });
    return apiResponse(res, 201, true, "Credits granted", { adCredits: await getAdCredits(user.id) });
});

// ── bulk ad actions ──────────────────────────────────────────
// POST /admin/ads/bulk  { ids: [...up to 100], action: approve | reject | feature | unfeature | delete, reason?, priority?, days? }
const BULK_PERMISSION = { approve: "ad:approve", reject: "ad:approve", feature: "ad:feature", unfeature: "ad:feature", delete: "ad:delete" };

export const bulkAds = asyncHandler(async (req, res) => {
    const { ids, action } = req.body ?? {};
    if (!BULK_PERMISSION[action]) throw ApiError.badRequest(`action must be one of: ${Object.keys(BULK_PERMISSION).join(", ")}`);
    if (!req.permissions.has(BULK_PERMISSION[action])) throw ApiError.forbidden("You don't have permission to perform this action");
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some((id) => typeof id !== "string")) throw ApiError.badRequest("ids must be a list of 1 to 100 ad ids");

    const uniqueIds = [...new Set(ids)];
    const reason = action === "reject" ? parseRejectReason(req.body) : null;
    const featureInput = action === "feature" ? parseFeatureBody({ ...req.body, isFeatured: true }) : null;

    const results = [];
    if (action === "unfeature") {
        const r = await setFeatured({ id: { in: uniqueIds } }, { isFeatured: false });
        results.push({ updated: r.count });
    } else if (action === "feature") {
        const r = await setFeatured({ id: { in: uniqueIds } }, featureInput);
        results.push({ updated: r.count });
    } else if (action === "delete") {
        const r = await prisma.ad.updateMany({ where: { id: { in: uniqueIds }, deletedAt: null }, data: { deletedAt: new Date() } });
        results.push({ updated: r.count });
    } else {
        // approving spends credits one ad at a time, so failures are reported per ad instead of aborting the batch
        for (const id of uniqueIds) {
            try {
                if (action === "approve") await approveAdById(id);
                else await rejectAdById(id, reason);
                results.push({ id, ok: true });
            } catch (error) {
                results.push({ id, ok: false, error: error.message });
            }
        }
    }
    await audit(req, `ad:bulk-${action}`, "Ad", null, { ids: uniqueIds, ...(reason && { reason }) });
    return apiResponse(res, 200, true, "Bulk action finished", results);
});

// ── contacts and leads ───────────────────────────────────────
// GET /admin/contacts?isRead=false
export const listContacts = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query, { defaultLimit: 20 });
    const where = req.query.isRead === undefined ? {} : { isRead: req.query.isRead === "true" };
    const [items, total] = await Promise.all([
        prisma.contact.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
        prisma.contact.count({ where }),
    ]);
    return apiResponse(res, 200, true, "Contacts", paginated(items, total, pagination));
});

// PATCH /admin/contacts/:id/read  { isRead? } — defaults to true
export const markContactRead = asyncHandler(async (req, res) => {
    const isRead = req.body?.isRead === undefined ? true : req.body.isRead === true || req.body.isRead === "true";
    const result = await prisma.contact.updateMany({ where: { id: req.params.id }, data: { isRead } });
    if (!result.count) throw ApiError.notFound("Message not found");
    return apiResponse(res, 200, true, "Updated", { isRead });
});

// DELETE /admin/contacts/:id
export const deleteContact = asyncHandler(async (req, res) => {
    const result = await prisma.contact.deleteMany({ where: { id: req.params.id } });
    if (!result.count) throw ApiError.notFound("Message not found");
    await audit(req, "contact:delete", "Contact", req.params.id);
    return apiResponse(res, 200, true, "Message deleted");
});

// GET /admin/insurance-leads?q=
export const listInsuranceLeads = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query, { defaultLimit: 20 });
    const where = req.query.q
        ? { OR: [{ email: { contains: like(req.query.q) } }, { firstName: { contains: like(req.query.q) } }, { lastName: { contains: like(req.query.q) } }, { mobile: { contains: like(req.query.q) } }] }
        : {};
    const [items, total] = await Promise.all([
        prisma.insuranceLead.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
        prisma.insuranceLead.count({ where }),
    ]);
    return apiResponse(res, 200, true, "Insurance leads", paginated(items, total, pagination));
});

// ── audit log and settings ───────────────────────────────────
// GET /admin/audit-logs?action=&entity=&userId=
export const listAuditLogs = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query, { defaultLimit: 50 });
    const where = {
        ...(req.query.action && { action: like(req.query.action) }),
        ...(req.query.entity && { entity: like(req.query.entity) }),
        ...(req.query.userId && { userId: like(req.query.userId) }),
    };
    const [rows, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { id: "desc" },
            skip: pagination.skip,
            take: pagination.take,
        }),
        prisma.auditLog.count({ where }),
    ]);
    const items = rows.map((row) => ({ ...row, id: row.id.toString() })); // BigInt is not JSON-serialisable
    return apiResponse(res, 200, true, "Audit logs", paginated(items, total, pagination));
});

// GET /admin/settings
export const getSettings = asyncHandler(async (req, res) => apiResponse(res, 200, true, "Settings", await readSettings(Object.keys(SETTINGS))));

// PUT /admin/settings/:key  — body is the new value (validated per key)
export const putSetting = asyncHandler(async (req, res) => {
    const value = await writeSetting(req.params.key, req.body);
    await audit(req, "setting:update", "Setting", req.params.key);
    return apiResponse(res, 200, true, "Setting saved", value);
});
