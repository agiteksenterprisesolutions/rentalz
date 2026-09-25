// Uploads the legacy ad photos listed in legacy-photo-manifest.json to R2 and creates AdPhoto rows.
//   node src/seed/upload-legacy-photos.js [path/to/legacy/images/Add]
// Re-runnable: photos whose key already exists are skipped.
import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import path from "path";
import prisma from "../config/prisma.js";
import { uploadImage } from "../services/storage.service.js";

const dir = process.argv[2] || "/home/wa/Downloads/aetherentalz-fully-working/images/Add";
const manifest = JSON.parse(readFileSync("legacy-photo-manifest.json", "utf8"));
const positions = new Map();
let uploaded = 0;
let skipped = 0;

try {
    for (const item of manifest) {
        const file = path.join(dir, item.path);
        if (!existsSync(file)) { console.warn(`missing file: ${item.path}`); skipped++; continue; }
        if (await prisma.adPhoto.findFirst({ where: { adId: item.adId, key: item.key } })) { skipped++; continue; }

        await uploadImage(readFileSync(file), "ads", item.key);
        const position = positions.get(item.adId) ?? (await prisma.adPhoto.count({ where: { adId: item.adId } }));
        positions.set(item.adId, position + 1);
        await prisma.adPhoto.create({ data: { adId: item.adId, key: item.key, position } });
        uploaded++;
    }
    console.log(JSON.stringify({ uploaded, skipped }));
} finally {
    await prisma.$disconnect();
}
