import express from "express";
import { allOrders, getOrder, myOrders, refund } from "../controllers/order.controller.js";
import { requireAnyPermission, requirePermissions } from "../middleware/acl.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const orderRouter = express.Router();

orderRouter.use(verifyUser);

orderRouter.get("/", requirePermissions("order:read-self"), myOrders);
orderRouter.get("/all", requirePermissions("order:list"), allOrders);
orderRouter.post("/:id/refund", requirePermissions("order:refund"), refund);
orderRouter.get("/:id", requireAnyPermission("order:read-self", "order:list"), getOrder);

export default orderRouter;
