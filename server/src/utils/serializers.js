import { publicUrl } from "../services/storage.service.js";

// Shape DB rows for the API: R2 keys become public URLs, internal columns are dropped.
export const serializeCategory = ({ imageKey, ...category }) => ({ ...category, imageUrl: publicUrl(imageKey) });

export const serializePhoto = ({ key, ...photo }) => ({ ...photo, url: publicUrl(key) });

export const serializeAd = ({ photos, deletedAt, ...ad }) => ({
    ...ad,
    ...(photos && { photos: photos.map(serializePhoto) }),
});
