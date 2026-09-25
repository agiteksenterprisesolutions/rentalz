import express from "express";
import { addFavourite, favouriteIds, listFavourites, removeFavourite } from "../controllers/favourite.controller.js";
import { requirePermissions } from "../middleware/acl.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const favouriteRouter = express.Router();

favouriteRouter.use(verifyUser, requirePermissions("favourite:manage-self"));

favouriteRouter.get("/", listFavourites);
favouriteRouter.get("/ids", favouriteIds);
favouriteRouter.post("/:adId", addFavourite);
favouriteRouter.delete("/:adId", removeFavourite);

export default favouriteRouter;
