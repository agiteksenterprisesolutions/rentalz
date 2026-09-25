import express from "express";
import { clearCart, getCart, removeCartItem, setCartItem } from "../controllers/cart.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const cartRouter = express.Router();

cartRouter.use(verifyUser);

cartRouter.get("/", getCart);
cartRouter.post("/items", setCartItem);
cartRouter.delete("/items/:packageId", removeCartItem);
cartRouter.delete("/", clearCart);

export default cartRouter;
