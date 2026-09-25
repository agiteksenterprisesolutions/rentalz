// Parse ?page=&limit= into Prisma skip/take (limit capped to protect the DB)
export const getPagination = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
    return { page, limit, skip: (page - 1) * limit, take: limit };
};

export const paginated = (items, total, { page, limit }) => ({
    items,
    pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
    },
});
