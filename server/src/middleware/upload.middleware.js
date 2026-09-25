import multer from "multer";
import { ApiError } from "../utils/error.js";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

// Memory storage: buffers go to sharp -> Cloudflare R2, nothing touches local disk
export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
        cb(ApiError.badRequest("Only JPG, PNG or WebP images are allowed"), false);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 15,
    },
});
