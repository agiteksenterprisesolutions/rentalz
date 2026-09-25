import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { ApiError } from "../utils/error.js";

// Cloudflare R2 speaks the S3 API. Objects are stored by key; the DB keeps only the key and the
// public URL is derived from R2_PUBLIC_URL (bucket custom domain or r2.dev URL).
const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_BUCKET;
const CONTENT_TYPES = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Public URL for a stored key (null-safe). */
export const publicUrl = (key) =>
    key ? `${(process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "")}/${key}` : null;

/** Re-encodes an image buffer (visually lossless), auto-rotates and caps the width. */
export const compressImage = async (fileBuffer, { maxWidth = 1920 } = {}) => {
    try {
        const image = sharp(fileBuffer).rotate().resize({ width: maxWidth, withoutEnlargement: true });
        const { format } = await sharp(fileBuffer).metadata();

        if (format === "jpeg") return { buffer: await image.jpeg({ quality: 85, progressive: true }).toBuffer(), format };
        if (format === "png") return { buffer: await image.png({ compressionLevel: 9, palette: true }).toBuffer(), format };
        return { buffer: await image.webp({ quality: 85 }).toBuffer(), format: "webp" };
    } catch (error) {
        throw new ApiError(`Image compression failed: ${error.message}`, 500);
    }
};

/** Compress + upload one image. `folder` e.g. "ads", "avatars", "categories"; `fixedKey` overrides the random key. Returns { key, url }. */
export const uploadImage = async (fileBuffer, folder = "general", fixedKey = null) => {
    if (!fileBuffer) throw ApiError.badRequest("No file buffer provided");

    const { buffer, format } = await compressImage(fileBuffer);
    const key = fixedKey ?? `${folder}/${randomUUID()}.${format === "jpeg" ? "jpg" : format}`;

    try {
        await r2.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: buffer,
                ContentType: CONTENT_TYPES[format],
                CacheControl: "public, max-age=31536000, immutable",
            }),
        );
    } catch (error) {
        throw ApiError.badRequest(`Image upload failed: ${error.message}`);
    }
    return { key, url: publicUrl(key) };
};

/** Upload many files in parallel -> [{ key, url }] */
export const uploadImages = async (files = [], folder = "general") =>
    Promise.all(files.map((file) => uploadImage(file.buffer, folder)));

export const deleteImage = async (key) => {
    if (!key) return null;
    try {
        return await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (error) {
        console.error(`Failed to delete image ${key}: ${error.message}`);
        return null;
    }
};
