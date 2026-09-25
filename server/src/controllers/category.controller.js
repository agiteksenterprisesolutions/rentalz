import prisma from "../config/prisma.js";
import { revalidateFrontend } from "../services/revalidate.service.js";
import { deleteImage, uploadImage } from "../services/storage.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateUniqueSlug } from "../utils/helper.js";
import { serializeCategory } from "../utils/serializers.js";

const MAX_LEVEL = 3;

// The tree is small and read on every page, so it is cached per process and dropped on any change.
const TREE_TTL_MS = 5 * 60 * 1000;
let treeCache = { data: null, expiresAt: 0 };
const invalidateTree = () => {
    treeCache = { data: null, expiresAt: 0 };
    revalidateFrontend("categories"); // the Next.js site caches categories too
};

const buildTree = (rows) => {
    const byParent = new Map();
    for (const row of rows) {
        const key = row.parentId ?? 0;
        if (!byParent.has(key)) byParent.set(key, []);
        byParent.get(key).push(serializeCategory(row));
    }
    const attach = (node) => ({ ...node, children: (byParent.get(node.id) ?? []).map(attach) });
    return (byParent.get(0) ?? []).map(attach);
};

// GET /categories?popular=true -> nested tree (active only), or the flat popular list for the home page
export const listCategories = asyncHandler(async (req, res) => {
    if (req.query.popular === "true") {
        const popular = await prisma.category.findMany({
            where: { isPopular: true, isActive: true },
            orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        });
        return apiResponse(res, 200, true, "Popular categories", popular.map(serializeCategory));
    }

    if (!treeCache.data || Date.now() > treeCache.expiresAt) {
        const rows = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        });
        treeCache = { data: buildTree(rows), expiresAt: Date.now() + TREE_TTL_MS };
    }
    return apiResponse(res, 200, true, "Categories", treeCache.data);
});

// GET /categories/manage -> the whole tree including inactive categories, never cached (category:update)
export const listCategoriesForAdmin = asyncHandler(async (req, res) => {
    const rows = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
    return apiResponse(res, 200, true, "Categories", buildTree(rows));
});

// GET /categories/:slug -> the category, its ancestors (breadcrumb) and direct children
export const getCategory = asyncHandler(async (req, res) => {
    const category = await prisma.category.findFirst({
        where: { slug: req.params.slug, isActive: true },
        include: { children: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] } },
    });
    if (!category) throw ApiError.notFound("Category not found");

    const breadcrumb = [];
    let parentId = category.parentId;
    while (parentId) {
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) break;
        breadcrumb.unshift({ id: parent.id, title: parent.title, slug: parent.slug });
        parentId = parent.parentId;
    }

    const { children, ...self } = category;
    return apiResponse(res, 200, true, "Category", {
        ...serializeCategory(self),
        breadcrumb,
        children: children.map(serializeCategory),
    });
});

const parseCategoryBody = (body, { partial = false } = {}) => {
    const data = {};
    if (body.title !== undefined || !partial) {
        const title = String(body.title ?? "").trim();
        if (!title || title.length > 191) throw ApiError.badRequest("Title is required (max 191 characters)");
        data.title = title;
    }
    if (body.isPopular !== undefined) data.isPopular = body.isPopular === true || body.isPopular === "true";
    if (body.isActive !== undefined) data.isActive = body.isActive === true || body.isActive === "true";
    if (body.sortOrder !== undefined) {
        const sortOrder = Number.parseInt(body.sortOrder, 10);
        if (!Number.isInteger(sortOrder)) throw ApiError.badRequest("sortOrder must be a number");
        data.sortOrder = sortOrder;
    }
    return data;
};

// POST /categories (multipart: optional `image`)
export const createCategory = asyncHandler(async (req, res) => {
    const data = parseCategoryBody(req.body);

    let level = 1;
    let parentId = null;
    if (req.body.parentId) {
        parentId = Number.parseInt(req.body.parentId, 10);
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) throw ApiError.badRequest("Parent category not found");
        level = parent.level + 1;
        if (level > MAX_LEVEL) throw ApiError.badRequest(`Categories can only be nested ${MAX_LEVEL} levels deep`);
    }

    const image = req.file ? await uploadImage(req.file.buffer, "categories") : null;
    try {
        const category = await prisma.category.create({
            data: { ...data, slug: await generateUniqueSlug(data.title, prisma.category), level, parentId, imageKey: image?.key ?? null },
        });
        invalidateTree();
        return apiResponse(res, 201, true, "Category created", serializeCategory(category));
    } catch (error) {
        if (image) await deleteImage(image.key);
        throw error;
    }
});

// PATCH /categories/:id (multipart: optional `image`). Parent and level are fixed after creation.
export const updateCategory = asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Category not found");

    const data = parseCategoryBody(req.body, { partial: true });
    if (data.title && data.title !== existing.title) data.slug = await generateUniqueSlug(data.title, prisma.category, id);

    const image = req.file ? await uploadImage(req.file.buffer, "categories") : null;
    if (image) data.imageKey = image.key;

    try {
        const category = await prisma.category.update({ where: { id }, data });
        if (image) await deleteImage(existing.imageKey);
        invalidateTree();
        return apiResponse(res, 200, true, "Category updated", serializeCategory(category));
    } catch (error) {
        if (image) await deleteImage(image.key);
        throw error;
    }
});

// DELETE /categories/:id — refused while it has children or ads
export const deleteCategory = asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Category not found");

    const [children, ads] = await Promise.all([
        prisma.category.count({ where: { parentId: id } }),
        prisma.ad.count({ where: { OR: [{ mainCategoryId: id }, { subCategoryId: id }, { leafCategoryId: id }] } }),
    ]);
    if (children) throw ApiError.conflict("Delete or move the sub-categories first");
    if (ads) throw ApiError.conflict("This category still has ads. Deactivate it instead");

    await prisma.category.delete({ where: { id } });
    await deleteImage(existing.imageKey);
    invalidateTree();
    return apiResponse(res, 200, true, "Category deleted");
});
