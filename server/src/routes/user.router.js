import express from "express";
import { cancelEmailChange, deleteMe, getDashboard, getMe, removeAvatar, requestEmailChange, setAvatar, updateMe } from "../controllers/user.controller.js";
import { requirePermissions } from "../middleware/acl.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { authLimiter, uploadLimiter } from "../utils/rate-limiter.js";

// Everything here acts on the signed-in user's own account.
const userRouter = express.Router();

userRouter.use(verifyUser);

userRouter.get("/me", requirePermissions("user:read-self"), getMe);
userRouter.patch("/me", requirePermissions("user:update-self"), updateMe);
userRouter.delete("/me", requirePermissions("user:delete-self"), authLimiter, deleteMe); // password check: brute-force limited

userRouter.post("/me/email", requirePermissions("user:update-self"), authLimiter, requestEmailChange); // password check: brute-force limited
userRouter.delete("/me/email", requirePermissions("user:update-self"), cancelEmailChange);

userRouter.put("/me/avatar", requirePermissions("user:update-self"), uploadLimiter, upload.single("avatar"), setAvatar);
userRouter.delete("/me/avatar", requirePermissions("user:update-self"), removeAvatar);

userRouter.get("/me/dashboard", requirePermissions("user:read-self"), getDashboard);

export default userRouter;
