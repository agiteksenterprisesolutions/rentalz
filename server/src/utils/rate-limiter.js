import rateLimit from "express-rate-limit";

const rateLimitHandler = (req, res) => {
    res.status(429).json({
        success: false,
        statusCode: 429,
        message: "Too many requests. Please try again later.",
    });
};

const base = {
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
};

// Applied globally
export const generalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 1000 });

// Login / register / forgot-password — only failed attempts count
export const authLimiter = rateLimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
});

// Public forms (contact, insurance quote) — prevents spam
export const formLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: 10 });

// Image / file uploads
export const uploadLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 60 });
