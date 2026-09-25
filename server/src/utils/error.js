export class ApiError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code; // optional machine-readable reason, e.g. EMAIL_NOT_VERIFIED
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad Request") {
        return new ApiError(message, 400);
    }

    static unauthorized(message = "Unauthorized") {
        return new ApiError(message, 401);
    }

    static forbidden(message = "Forbidden", code = null) {
        return new ApiError(message, 403, code);
    }

    static notFound(message = "Resource not found") {
        return new ApiError(message, 404);
    }

    static conflict(message = "Conflict") {
        return new ApiError(message, 409);
    }
}

export const notFoundHandler = (req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

export const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // JWT errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Invalid or expired token";
    }

    // Prisma known errors
    if (err.code === "P2002") {
        statusCode = 409;
        message = "A record with this value already exists";
    } else if (err.code === "P2025") {
        statusCode = 404;
        message = "Record not found";
    }

    // Don't leak internals of unexpected errors in production
    if (statusCode === 500 && process.env.NODE_ENV === "production") {
        message = "Internal Server Error";
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(err.code && typeof err.code === "string" && err.statusCode && { code: err.code }),
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
};
