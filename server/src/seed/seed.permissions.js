import "dotenv/config";
import prisma from "../config/prisma.js";
import { UserRole } from "../generated/prisma/enums.ts";

// Naming convention: resource:action
const permissions = [
    // users
    ["user:list", "List all users"],
    ["user:read", "View a user"],
    ["user:create", "Create a user"],
    ["user:update", "Update any user"],
    ["user:delete", "Soft-delete a user"],
    ["user:block", "Block / unblock a user"],
    ["user:change-role", "Change a user's role"],
    ["user:read-self", "Read own profile"],
    ["user:update-self", "Update own profile"],
    ["user:delete-self", "Delete own account"],

    // ads
    ["ad:list", "List all ads (any status)"],
    ["ad:read", "View any ad"],
    ["ad:create", "Create an ad"],
    ["ad:update", "Update any ad"],
    ["ad:update-self", "Update own ad"],
    ["ad:delete", "Delete any ad"],
    ["ad:delete-self", "Delete own ad"],
    ["ad:approve", "Approve / reject ads"],
    ["ad:feature", "Feature ads and set priority"],
    ["ad:assign", "Reassign an ad to another user"],

    // catalog
    ["category:create", "Create categories"],
    ["category:update", "Update categories"],
    ["category:delete", "Delete categories"],
    ["city:manage", "Manage cities"],
    ["make:manage", "Manage makes"],

    // engagement
    ["favourite:manage-self", "Manage own favourites"],
    ["savedsearch:manage-self", "Manage own saved searches"],

    // plans & payments
    ["package:create", "Create packages"],
    ["package:update", "Update packages"],
    ["package:delete", "Delete packages"],
    ["order:list", "List all orders / payments"],
    ["order:read-self", "View own orders"],
    ["order:refund", "Refund an order"],

    // content
    ["contact:list", "View contact messages"],
    ["contact:delete", "Delete contact messages"],
    ["insurance:list", "View insurance leads"],
    ["setting:read", "Read site settings"],
    ["setting:update", "Update site settings / SEO meta"],
    ["audit:list", "View audit logs"],

    // reports
    ["report:sales", "View sales reports"],
    ["report:ads", "View ad reports"],
].map(([name, description]) => ({ name, description }));

const USER_PERMS = [
    "user:read-self", "user:update-self", "user:delete-self",
    "ad:create", "ad:update-self", "ad:delete-self",
    "favourite:manage-self", "savedsearch:manage-self",
    "order:read-self",
];

const MODERATOR_PERMS = [
    ...USER_PERMS,
    "user:list", "user:read",
    "ad:list", "ad:read", "ad:approve", "ad:feature",
    "contact:list", "insurance:list", "report:ads",
];

const rolePermissionMap = {
    [UserRole.ADMIN]: permissions.map((p) => p.name), // everything
    [UserRole.MODERATOR]: MODERATOR_PERMS,
    [UserRole.USER]: USER_PERMS,
};

async function main() {
    for (const p of permissions) {
        await prisma.permission.upsert({ where: { name: p.name }, update: { description: p.description }, create: p });
    }

    const all = await prisma.permission.findMany();
    const idByName = new Map(all.map((p) => [p.name, p.id]));

    for (const [role, names] of Object.entries(rolePermissionMap)) {
        await prisma.rolePermission.deleteMany({ where: { role } });
        await prisma.rolePermission.createMany({
            data: names.map((name) => {
                if (!idByName.has(name)) throw new Error(`Unknown permission "${name}" for role ${role}`);
                return { role, permissionId: idByName.get(name) };
            }),
            skipDuplicates: true,
        });
        console.log(`${role}: ${names.length} permissions`);
    }
}

main()
    .then(() => console.log("Permissions seeded"))
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
