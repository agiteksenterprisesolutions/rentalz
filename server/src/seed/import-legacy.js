// One-off import of the legacy Laravel database into the new schema.
//   1. Load the legacy dump into a scratch database (default name: legacy).
//   2. Set LEGACY_DATABASE_URL if it is not the same server as DATABASE_URL with the database name "legacy".
//   3. node src/seed/import-legacy.js
// Safe to re-run: reference data and users/ads are upserted; logs are only imported into empty tables.
import "dotenv/config";
import { randomUUID } from "crypto";
import mariadb from "mariadb";
import prisma from "../config/prisma.js";
import { AdStatus, AdType, AdEventType, OperatorOption, UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { writeFileSync } from "fs";

const legacyUrl = process.env.LEGACY_DATABASE_URL || process.env.DATABASE_URL.replace(/\/[^/]*$/, "/legacy");
const u = new URL(legacyUrl);
const legacy = await mariadb.createConnection({
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1),
    dateStrings: true,
    bigIntAsNumber: true,
    insertIdAsNumber: true,
});
const rows = (sql) => legacy.query(sql);
const report = {};
const note = (key, value) => (report[key] = value);

// ── helpers ──────────────────────────────────────────────────
const slugify = (s) =>
    String(s).toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const toDate = (v) => {
    if (!v || String(v).startsWith("0000")) return null;
    const d = new Date(String(v).replace(" ", "T") + (String(v).length > 10 ? "Z" : ""));
    return Number.isNaN(d.getTime()) ? null : d;
};
const toNum = (v) => {
    const n = parseFloat(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
};
const toInt = (v) => {
    const n = toNum(v);
    return n === null ? null : Math.trunc(n);
};
const clip = (v, n) => (v == null || v === "" ? null : String(v).trim().slice(0, n) || null);
const inRange = (n, min, max) => (n !== null && n >= min && n <= max ? n : null);
// Legacy names contain spelling mistakes and inconsistent casing; corrected on the way in.
const TEXT_FIXES = [
    [/\bStandared\b/g, "Standard"],
    [/\bSingle Add\b/g, "Single Ad"],
    [/\bVip\b/g, "VIP"],
    [/\bConrrete\b/g, "Concrete"],
    [/\bMasonary\b/g, "Masonry"],
    [/\bmainfolds\b/gi, "Manifolds"],
    [/\bVaccum\b/g, "Vacuum"],
    [/\bSclaper\b/g, "Scraper"],
    [/\bHydraulick\b/g, "Hydraulic"],
    [/\bLandscap\b/g, "Landscaping"],
    [/\bCaterpiller\b/g, "Caterpillar"],
    [/\bMotor Grade\b/g, "Motor Grader"],
    [/\bForkLifts\b/g, "Forklifts"],
    [/\bFlatBedTrucks\b/g, "Flatbed Trucks"],
    [/\bFuelTankers\b/g, "Fuel Tankers"],
    [/\bMiniBus\b/g, "Minibus"],
    [/\bFlat bed Trailer\b/g, "Flatbed Trailer"],
    [/^compaction$/, "Compaction"],
    [/^compressed Air Tools$/, "Compressed Air Tools"],
    [/^landscaping Power Tool$/, "Landscaping Power Tool"],
];
const fixText = (s) => (s == null ? s : TEXT_FIXES.reduce((text, [pattern, fixed]) => text.replace(pattern, fixed), String(s)).replace(/\s{2,}/g, " ").trim());
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

// ── reference data ───────────────────────────────────────────
const importCities = async () => {
    const data = await rows("select id, name from states order by id");
    for (const s of data) {
        const name = s.name.trim();
        await prisma.city.upsert({ where: { id: s.id }, update: { name }, create: { id: s.id, name, slug: slugify(name) } });
    }
    note("cities", data.length);
};

const importMakes = async () => {
    const data = await rows("select name from makes where name is not null and trim(name) <> ''");
    await prisma.make.createMany({ data: data.map((m) => ({ name: fixText(m.name.trim()) })), skipDuplicates: true });
    note("makes", data.length);
};

const importCategories = async () => {
    const data = await rows("select id, title, cat_slug, parent_id, level, image from categories order by level, id");
    // Legacy `level` is unreliable (some roots are stored as level 2): derive it from the parent chain instead.
    const parentOf = new Map(data.map((c) => [c.id, c.parent_id || null]));
    const levelOf = (id, seen = new Set()) => {
        const parent = parentOf.get(id);
        if (!parent || !parentOf.has(parent) || seen.has(id)) return 1;
        return 1 + levelOf(parent, seen.add(id));
    };
    data.sort((x, y) => levelOf(x.id) - levelOf(y.id) || x.id - y.id);

    const usedSlugs = new Set();
    for (const c of data) {
        let slug = slugify(fixText(c.title)); // regenerated from the corrected title
        if (usedSlugs.has(slug)) slug = `${slug}-${c.id}`;
        usedSlugs.add(slug);
        const fields = {
            title: fixText(c.title.trim()),
            slug,
            level: levelOf(c.id),
            parentId: c.parent_id ? c.parent_id : null,
        };
        await prisma.category.upsert({ where: { id: c.id }, update: fields, create: { id: c.id, ...fields } });
    }
    note("categories", data.length);
};

const importPackages = async () => {
    const cats = await rows("select id, title from package_categories order by id");
    for (const c of cats) {
        await prisma.packageCategory.upsert({ where: { id: c.id }, update: { title: fixText(c.title) }, create: { id: c.id, title: fixText(c.title), sortOrder: c.id } });
    }
    const pk = await rows("select * from packages order by id");
    for (const p of pk) {
        const fields = {
            categoryId: toInt(p.category_id),
            name: fixText(p.name.trim()),
            details: p.details || null,
            adCount: toInt(p.no_of_adds) ?? 1,
            durationValue: toInt(p.duration) ?? 30,
            amount: p.amount ?? 0,
            featuredDays: toInt(p.f_days) ?? 0,
            hasAnalytics: p.analytics === "Full Access",
            hasSupport: Boolean(p.customer_care),
        };
        await prisma.package.upsert({ where: { id: p.id }, update: fields, create: { id: p.id, ...fields } });
    }
    note("packages", pk.length);
};

const importSettings = async () => {
    const [m] = await rows("select meta_title, meta_description, meta_keywords from metas order by id limit 1");
    if (!m) return;
    const value = {
        siteName: "TheRentalz",
        titleTemplate: "%s | TheRentalz",
        title: fixText(m.meta_title) || "TheRentalz",
        description: m.meta_description || "",
        keywords: String(m.meta_keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
        ogImageUrl: "",
    };
    await prisma.setting.upsert({ where: { key: "seo.default" }, update: { value }, create: { key: "seo.default", value } });
    note("settings", 1);
};

// ── users ────────────────────────────────────────────────────
const isTestAccount = (email) => /^testing@example\.com/i.test(email);

const importUsers = async () => {
    const data = await rows("select * from users order by id");
    const idMap = new Map();
    let skipped = 0;
    for (const l of data) {
        if (isTestAccount(l.email)) { skipped++; continue; }
        const email = l.email.trim().toLowerCase();
        const [first, ...rest] = l.name.trim().split(/\s+/);
        const verified = Boolean(l.email_verified_at);
        const fields = {
            name: l.name.trim(),
            passwordHash: l.password ? l.password.replace(/^\$2y\$/, "$2b$") : null, // bcrypt-compatible prefix
            role: l.is_admin ? UserRole.ADMIN : UserRole.USER,
            status: verified ? UserStatus.ACTIVE : UserStatus.PENDING,
            emailVerified: verified,
            provider: l.provider || null,
            providerId: l.provider_id || l.google_id || null,
            createdAt: toDate(l.created_at) ?? new Date(),
        };
        const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email, ...fields } });
        idMap.set(l.id, user.id);
        if (l.remaining_ads > 0 && !(await prisma.adCreditLot.count({ where: { userId: user.id } }))) {
            await prisma.adCreditLot.create({ data: { userId: user.id, source: "FREE", granted: l.remaining_ads, remaining: l.remaining_ads } });
        }
        const [p] = await rows(`select * from profiles where user_id = ${l.id} limit 1`);
        await prisma.profile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                firstName: clip(p?.first_name ?? first, 255),
                lastName: clip(p?.last_name ?? rest.join(" "), 255),
                aboutMe: p?.about_me || null,
                organizationName: clip(p?.organization_name || p?.business_name, 255),
                birthday: toDate(p?.birthday),
                gender: clip(p?.gender, 255),
            },
        });
        if (p?.phone && !user.phone) await prisma.user.update({ where: { id: user.id }, data: { phone: clip(p.phone, 20) } });
    }
    note("users", { imported: idMap.size, skippedTestAccounts: skipped });
    return idMap;
};

// ── ads ──────────────────────────────────────────────────────
const yesNo = (v) => (v === 1 ? OperatorOption.WITH_OPERATOR : v === 2 ? OperatorOption.WITHOUT_OPERATOR : null);
const AD_TYPES = { rent: AdType.RENT, sell: AdType.SELL, premium: AdType.PREMIUM };
// Legacy rows with no usable add_type ("rest") used to land in a catch-all PRODUCT type, which the UI then showed
// as a meaningless "Product" tag. Infer rent vs sale instead: a daily/weekly/monthly rate means it was a rental.
const inferredType = (a) => ([a.d_price, a.w_price, a.m_price].map(toNum).some((n) => n > 0) ? AdType.RENT : AdType.SELL);

const importAds = async (userMap) => {
    const data = await rows("select * from adds order by id");
    const cats = new Set((await prisma.category.findMany({ select: { id: true } })).map((c) => c.id));
    const makes = new Map((await prisma.make.findMany()).map((m) => [m.name.toLowerCase(), m.id]));
    const adMap = new Map();
    let skipped = 0;
    for (const a of data) {
        const userId = userMap.get(a.user_id);
        if (!userId) { skipped++; continue; }
        const catId = (v) => (cats.has(toInt(v)) ? toInt(v) : null);
        const prices = [a.price, a.d_price, a.w_price, a.m_price].map(toNum).filter((n) => n && n > 0);
        const year = /^(19|20)\d{2}$/.test(String(a.model ?? "").trim()) ? Number(a.model) : null;
        const make = a.make ? makes.get(fixText(a.make.trim()).toLowerCase()) ?? null : null;
        const fields = {
            userId,
            creatorId: userId,
            type: AD_TYPES[a.add_type] ?? inferredType(a),
            status: a.status === 1 ? AdStatus.APPROVED : AdStatus.PENDING,
            title: clip(fixText(a.title), 255) ?? "Untitled",
            description: a.description || null,
            phone: clip(a.phone, 20),
            mainCategoryId: catId(a.m_category),
            subCategoryId: catId(a.s_subcategory),
            leafCategoryId: catId(a.ss_subcategory),
            cityId: toInt(a.city),
            makeId: make,
            model: year ? null : clip(a.model, 100),
            modelYear: year,
            capacity: clip(a.capacity, 100),
            operator: yesNo(a.operator),
            insurance: a.insurance === 1 ? true : a.insurance === 2 ? false : null,
            warranty: a.warranty === 0 ? true : a.warranty === 1 ? false : null, // 2 = does not apply
            fuelType: clip(a.fuel_type, 50),
            transportation: a.transportation == null ? null : Boolean(a.transportation),
            terms: a.terms || null,
            currency: clip(a.currency, 3) ?? "AED",
            price: prices.length ? Math.min(...prices) : 0,
            dailyPrice: toNum(a.d_price),
            weeklyPrice: toNum(a.w_price),
            monthlyPrice: toNum(a.m_price),
            address: clip(a.address, 255),
            latitude: toNum(a.latitude),
            longitude: toNum(a.longitude),
            isFeatured: Boolean(a.is_featured),
            priority: a.priority ?? 0,
            publishedAt: toDate(a.publish_date),
            expiresAt: toDate(a.publish_end_date),
            createdAt: toDate(a.created_at) ?? new Date(),
            deletedAt: toDate(a.deleted_at),
        };
        const ad = await prisma.ad.upsert({ where: { slug: a.slug }, update: {}, create: { id: randomUUID(), slug: a.slug, ...fields } });
        adMap.set(a.id, ad.id);
    }
    note("ads", { imported: adMap.size, skippedUnknownOwner: skipped });
    return adMap;
};

// Photos live on the legacy server's disk; the R2 upload is a separate step, so write a manifest.
const exportPhotoManifest = async (adMap) => {
    const data = await rows(
        "select parent_id, path from photos where parent_id is not null union select parent_id, path from images where parent_id is not null",
    );
    const manifest = data.filter((p) => adMap.has(p.parent_id)).map((p) => ({ adId: adMap.get(p.parent_id), legacyAdId: p.parent_id, path: p.path, key: `ads/legacy/${p.path}` }));
    writeFileSync("legacy-photo-manifest.json", JSON.stringify(manifest, null, 2));
    note("photoManifest", `${manifest.length} files -> server/legacy-photo-manifest.json (not uploaded)`);
};

const importFavourites = async (userMap, adMap) => {
    const data = await rows("select user_id, add_id, created_at from favourites");
    const valid = data.filter((f) => userMap.has(f.user_id) && adMap.has(f.add_id));
    await prisma.favourite.createMany({
        data: valid.map((f) => ({ userId: userMap.get(f.user_id), adId: adMap.get(f.add_id), createdAt: toDate(f.created_at) ?? new Date() })),
        skipDuplicates: true,
    });
    note("favourites", valid.length);
};

// ── logs / leads (only into empty tables) ────────────────────
const importAdEvents = async (userMap, adMap) => {
    if ((await prisma.adEvent.count()) > 0) return note("adEvents", "skipped (table not empty)");
    const data = await rows("select user_id, add_id, type, created_at from add__search__statuses order by id");
    const mapped = data
        .filter((e) => adMap.has(e.add_id))
        .map((e) => ({
            adId: adMap.get(e.add_id),
            userId: userMap.get(e.user_id) ?? null,
            type: e.type === "detail" ? AdEventType.VIEW : AdEventType.SEARCH_IMPRESSION,
            createdAt: toDate(e.created_at) ?? new Date(),
        }));
    for (const part of chunk(mapped, 5000)) await prisma.adEvent.createMany({ data: part });
    note("adEvents", mapped.length);
};

const importContacts = async () => {
    if ((await prisma.contact.count()) > 0) return note("contacts", "skipped (table not empty)");
    const data = await rows("select name, email, message, created_at from contacts order by id");
    const mapped = data.map((c) => ({ name: clip(c.name, 191) ?? "-", email: clip(c.email, 191) ?? "-", message: c.message, isRead: true, createdAt: toDate(c.created_at) ?? new Date() }));
    for (const part of chunk(mapped, 1000)) await prisma.contact.createMany({ data: part });
    note("contacts", mapped.length);
};

const importInsuranceLeads = async () => {
    if ((await prisma.insuranceLead.count()) > 0) return note("insuranceLeads", "skipped (table not empty)");
    const data = await rows("select * from insurances order by id");
    const mapped = data.map((i) => {
        const dob = String(i.date_of_birth ?? "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        return {
            city: clip(i.city, 191) ?? "-", // legacy column actually holds free text (e.g. "8 years")
            make: clip(i.make, 191) ?? "-",
            model: clip(i.model, 191),
            yearManufacturing: inRange(toInt(i.year_manufacturing), 1900, 2100),
            currentlyInsured: clip(i.currently, 191),
            vehicleValue: inRange(toNum(i.car_value), 0, 9999999999), // legacy free text: drop junk
            insuranceType: clip(i.type_insurance, 191),
            claimHistory: clip(i.claim_history, 191),
            firstName: clip(i.first_name, 191) ?? "-",
            lastName: clip(i.last_name, 191),
            email: clip(i.email, 191) ?? "-",
            mobile: clip(i.mobile_number, 191) ?? "-",
            dateOfBirth: dob ? new Date(Date.UTC(+dob[1], +dob[2] - 1, +dob[3])) : null,
            nationality: clip(i.nationality, 191),
            createdAt: toDate(i.created_at) ?? new Date(),
        };
    });
    for (const part of chunk(mapped, 1000)) await prisma.insuranceLead.createMany({ data: part });
    note("insuranceLeads", mapped.length);
};

// ── run ──────────────────────────────────────────────────────
try {
    await importCities();
    await importMakes();
    await importCategories();
    await importPackages();
    await importSettings();
    const userMap = await importUsers();
    const adMap = await importAds(userMap);
    await exportPhotoManifest(adMap);
    await importFavourites(userMap, adMap);
    await importAdEvents(userMap, adMap);
    await importContacts();
    await importInsuranceLeads();
    console.log(JSON.stringify(report, null, 2));
} finally {
    await legacy.end();
    await prisma.$disconnect();
}
