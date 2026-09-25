import express from "express";
import {
    changePassword, confirmEmailChange, forgotPassword, loginUser, logoutUser, me,
    refreshToken, registerUser, resendVerification, resetPassword, verifyEmail,
} from "../controllers/auth.controller.js";
import { exchangeSocialCode, socialCallback, socialProviders, startSocialLogin } from "../controllers/social-auth.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { authLimiter } from "../utils/rate-limiter.js";

const authRouter = express.Router();

authRouter.post("/register", authLimiter, registerUser);
authRouter.post("/verify-email", authLimiter, verifyEmail);
authRouter.post("/resend-verification", authLimiter, resendVerification);
authRouter.post("/confirm-email-change", authLimiter, confirmEmailChange);
authRouter.post("/login", authLimiter, loginUser);
authRouter.post("/logout", logoutUser);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/forgot-password", authLimiter, forgotPassword);
authRouter.post("/reset-password", authLimiter, resetPassword);

authRouter.get("/me", verifyUser, me);
authRouter.post("/change-password", verifyUser, changePassword);

// Sign in with Google / Facebook. The provider routes come last so they never shadow the fixed ones above (/me, /login ...).
authRouter.get("/providers", socialProviders);
authRouter.post("/social/exchange", authLimiter, exchangeSocialCode);
authRouter.get("/:provider", startSocialLogin);
authRouter.get("/:provider/callback", socialCallback);

export default authRouter;
