import express from "express";
import {
    addPhotos, approveAd, assignAd, createAd, deleteAd, featureAd, featuredAds, getAd, manageAds,
    myAds, rejectAd, removePhoto, searchAds, trackContactClick, updateAd,
} from "../controllers/ad.controller.js";
import prisma from "../config/prisma.js";
import { requireOwnershipOrPermission, requirePermissions } from "../middleware/acl.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { optionalUser, verifyUser } from "../middleware/verify.middleware.js";
import { uploadLimiter } from "../utils/rate-limiter.js";

const adRouter = express.Router();

const adOwner = async (req) => (await prisma.ad.findFirst({ where: { id: req.params.id, deletedAt: null }, select: { userId: true } }))?.userId;
const ownerOrAdmin = (permission) => [verifyUser, requireOwnershipOrPermission(permission, adOwner)];

// Public
adRouter.get("/", searchAds);
adRouter.get("/featured", featuredAds);

// Seller / moderation lists — must stay above "/:slug"
adRouter.get("/mine", verifyUser, myAds);
adRouter.get("/manage", verifyUser, requirePermissions("ad:list"), manageAds);

adRouter.get("/:slug", optionalUser, getAd);
adRouter.post("/:id/click", optionalUser, trackContactClick);

// Seller (ownership or admin permission enforced per ad)
adRouter.post("/", verifyUser, requirePermissions("ad:create"), uploadLimiter, upload.array("photos", 15), createAd);
adRouter.patch("/:id", ...ownerOrAdmin("ad:update"), updateAd);
adRouter.delete("/:id", ...ownerOrAdmin("ad:delete"), deleteAd);
adRouter.post("/:id/photos", ...ownerOrAdmin("ad:update"), uploadLimiter, upload.array("photos", 15), addPhotos);
adRouter.delete("/:id/photos/:photoId", ...ownerOrAdmin("ad:update"), removePhoto);

// Moderation
adRouter.post("/:id/approve", verifyUser, requirePermissions("ad:approve"), approveAd);
adRouter.post("/:id/reject", verifyUser, requirePermissions("ad:approve"), rejectAd);
adRouter.post("/:id/feature", verifyUser, requirePermissions("ad:feature"), featureAd);
adRouter.post("/:id/assign", verifyUser, requirePermissions("ad:assign"), assignAd);

export default adRouter;
