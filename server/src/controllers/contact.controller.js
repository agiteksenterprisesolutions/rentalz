import prisma from "../config/prisma.js";
import { verifyTurnstile } from "../utils/captcha.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /contact — public contact form (captcha + strict rate limit on the route)
export const submitContact = asyncHandler(async (req, res) => {
    const { name, email, message, captchaToken } = req.body ?? {};
    const cleanName = String(name ?? "").trim();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanMessage = String(message ?? "").trim();

    if (!cleanName || cleanName.length > 191) throw ApiError.badRequest("Name is required (max 191 characters)");
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 191) throw ApiError.badRequest("A valid email is required");
    if (cleanMessage.length < 10 || cleanMessage.length > 5000) throw ApiError.badRequest("Message must be between 10 and 5000 characters");

    await verifyTurnstile(captchaToken, req.ip);

    await prisma.contact.create({ data: { name: cleanName, email: cleanEmail, message: cleanMessage } });
    return apiResponse(res, 201, true, "Thanks for reaching out. We'll get back to you soon.");
});
