import prisma from "../config/prisma.js";

/** Records an admin/moderator action. Never throws: an audit failure must not undo the action itself. */
export const audit = async (req, action, entity, entityId = null, meta = null) => {
    try {
        await prisma.auditLog.create({ data: { userId: req.user?.id ?? null, action, entity, entityId, meta, ip: req.ip?.slice(0, 45) ?? null } });
    } catch (error) {
        console.error(`Audit log failed for ${action}: ${error.message}`);
    }
};
