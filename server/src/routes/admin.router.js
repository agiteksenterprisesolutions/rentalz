import express from "express";
import {
    bulkAds, createUser, deleteContact, deleteUser, getSettings, getUser, grantUserCredits, listAuditLogs, listContacts,
    listInsuranceLeads, listUsers, markContactRead, putSetting, salesReport, setUserRole, setUserStatus, stats,
} from "../controllers/admin.controller.js";
import { requireAnyPermission, requirePermissions } from "../middleware/acl.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const adminRouter = express.Router();

adminRouter.use(verifyUser);

adminRouter.get("/stats", requireAnyPermission("report:ads", "report:sales"), stats);
adminRouter.get("/reports/sales", requirePermissions("report:sales"), salesReport);

adminRouter.get("/users", requirePermissions("user:list"), listUsers);
adminRouter.post("/users", requirePermissions("user:create"), createUser);
adminRouter.get("/users/:id", requirePermissions("user:read"), getUser);
adminRouter.patch("/users/:id/status", requirePermissions("user:block"), setUserStatus);
adminRouter.patch("/users/:id/role", requirePermissions("user:change-role"), setUserRole);
adminRouter.post("/users/:id/credits", requirePermissions("user:update"), grantUserCredits);
adminRouter.delete("/users/:id", requirePermissions("user:delete"), deleteUser);

adminRouter.post("/ads/bulk", requireAnyPermission("ad:approve", "ad:feature", "ad:delete"), bulkAds);

adminRouter.get("/contacts", requirePermissions("contact:list"), listContacts);
adminRouter.patch("/contacts/:id/read", requirePermissions("contact:list"), markContactRead);
adminRouter.delete("/contacts/:id", requirePermissions("contact:delete"), deleteContact);
adminRouter.get("/insurance-leads", requirePermissions("insurance:list"), listInsuranceLeads);

adminRouter.get("/audit-logs", requirePermissions("audit:list"), listAuditLogs);
adminRouter.get("/settings", requirePermissions("setting:read"), getSettings);
adminRouter.put("/settings/:key", requirePermissions("setting:update"), putSetting);

export default adminRouter;
