import "dotenv/config";
import prisma from "../config/prisma.js";
import { UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { hashPassword } from "../utils/helper.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function main() {
    if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
    if (process.env.NODE_ENV === "production" && password.length < 12) {
        throw new Error("ADMIN_PASSWORD must be at least 12 characters in production");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return console.log(`Admin ${email} already exists`);

    await prisma.user.create({
        data: {
            name: "Administrator",
            email,
            passwordHash: await hashPassword(password),
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            profile: { create: {} },
        },
    });
    console.log(`Admin ${email} created`);
}

main()
    .catch((e) => { console.error(e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
