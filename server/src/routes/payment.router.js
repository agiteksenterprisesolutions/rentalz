import express from "express";
import { confirmOrder, createCheckout } from "../controllers/payment.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { formLimiter } from "../utils/rate-limiter.js";

// The webhook is mounted separately in index.js (it needs the raw body, before express.json()).
const paymentRouter = express.Router();

paymentRouter.post("/checkout", verifyUser, formLimiter, createCheckout);
paymentRouter.post("/confirm", verifyUser, confirmOrder);

export default paymentRouter;
