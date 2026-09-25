import express from "express";
import { createSavedSearch, deleteSavedSearch, listSavedSearches } from "../controllers/saved-search.controller.js";
import { requirePermissions } from "../middleware/acl.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const savedSearchRouter = express.Router();

savedSearchRouter.use(verifyUser, requirePermissions("savedsearch:manage-self"));

savedSearchRouter.get("/", listSavedSearches);
savedSearchRouter.post("/", createSavedSearch);
savedSearchRouter.delete("/:id", deleteSavedSearch);

export default savedSearchRouter;
