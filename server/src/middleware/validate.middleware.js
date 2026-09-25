import { ApiError } from "../utils/error.js";

// Tiny schema-less validator: validate(["title", "price"]) rejects missing/blank body fields.
// Swap for zod/joi later without touching routes that already use validate().
export const validate = (requiredFields = []) => (req, res, next) => {
    const missing = requiredFields.filter((field) => {
        const value = req.body?.[field];
        return value === undefined || value === null || String(value).trim() === "";
    });
    if (missing.length) return next(ApiError.badRequest(`Missing required field(s): ${missing.join(", ")}`));
    next();
};
