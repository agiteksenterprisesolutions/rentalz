import express from "express";
import { createPackage, deletePackage, listPackages, managePackages, updatePackage } from "../controllers/package.controller.js";
import { requirePermissions } from "../middleware/acl.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const packageRouter = express.Router();

packageRouter.get("/", listPackages);
packageRouter.get("/manage", verifyUser, requirePermissions("package:update"), managePackages);
packageRouter.post("/", verifyUser, requirePermissions("package:create"), createPackage);
packageRouter.patch("/:id", verifyUser, requirePermissions("package:update"), updatePackage);
packageRouter.delete("/:id", verifyUser, requirePermissions("package:delete"), deletePackage);

export default packageRouter;
