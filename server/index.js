import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";

import { validateEnv } from "./src/config/env.js";
import { generalLimiter } from "./src/utils/rate-limiter.js";
import { globalErrorHandler, notFoundHandler } from "./src/utils/error.js";
import { startAdExpiryJob } from "./src/services/ad-expiry.service.js";
import authRouter from "./src/routes/auth.router.js";
import adRouter from "./src/routes/ad.router.js";
import favouriteRouter from "./src/routes/favourite.router.js";
import catalogRouter from "./src/routes/catalog.router.js";
import adminRouter from "./src/routes/admin.router.js";
import contactRouter from "./src/routes/contact.router.js";
import seoRouter from "./src/routes/seo.router.js";
import userRouter from "./src/routes/user.router.js";
import cartRouter from "./src/routes/cart.router.js";
import orderRouter from "./src/routes/order.router.js";
import packageRouter from "./src/routes/package.router.js";
import paymentRouter from "./src/routes/payment.router.js";
import { stripeWebhook } from "./src/controllers/payment.controller.js";
import categoryRouter from "./src/routes/category.router.js";
import savedSearchRouter from "./src/routes/saved-search.router.js";

validateEnv();

const app = express();
const PORT = process.env.PORT || 8000;
export const API_VERSION = process.env.API_VERSION || "/api/v1";

// Behind a reverse proxy (nginx / Cloudflare) — needed for correct req.ip in rate limiting
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(compression());

// Stripe webhook must receive the raw body, so it is mounted BEFORE express.json()
app.post(`${API_VERSION}/payments/webhook`, express.raw({ type: "application/json", limit: "1mb" }), stripeWebhook);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(generalLimiter);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// Routes
app.use(`${API_VERSION}/auth`, authRouter);
app.use(`${API_VERSION}/users`, userRouter);
app.use(`${API_VERSION}/ads`, adRouter);
app.use(`${API_VERSION}/categories`, categoryRouter);
app.use(`${API_VERSION}/catalog`, catalogRouter);
app.use(`${API_VERSION}/favourites`, favouriteRouter);
app.use(`${API_VERSION}/saved-searches`, savedSearchRouter);
app.use(`${API_VERSION}/packages`, packageRouter);
app.use(`${API_VERSION}/cart`, cartRouter);
app.use(`${API_VERSION}/payments`, paymentRouter);
app.use(`${API_VERSION}/orders`, orderRouter);
app.use(`${API_VERSION}/contact`, contactRouter);
app.use(`${API_VERSION}/seo`, seoRouter);
app.use(`${API_VERSION}/admin`, adminRouter);
// app.use(`${API_VERSION}/admin`, adminRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startAdExpiryJob();
});
