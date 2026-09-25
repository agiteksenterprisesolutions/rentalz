import express from "express";
import {
    createCategory, deleteCategory, getCategory, listCategories, listCategoriesForAdmin, updateCategory,
} from "../controllers/category.controller.js";
import { requirePermissions } from "../middleware/acl.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { uploadLimiter } from "../utils/rate-limiter.js";

const categoryRouter = express.Router();

categoryRouter.get("/", listCategories);
categoryRouter.get("/manage", verifyUser, requirePermissions("category:update"), listCategoriesForAdmin);
categoryRouter.get("/:slug", getCategory);

categoryRouter.post("/", verifyUser, requirePermissions("category:create"), uploadLimiter, upload.single("image"), createCategory);
categoryRouter.patch("/:id", verifyUser, requirePermissions("category:update"), uploadLimiter, upload.single("image"), updateCategory);
categoryRouter.delete("/:id", verifyUser, requirePermissions("category:delete"), deleteCategory);

export default categoryRouter;
