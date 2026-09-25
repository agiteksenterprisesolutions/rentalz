import ejs from "ejs";
import path from "path";
import prisma from "../config/prisma.js";
import { transporter } from "../config/mail.js";
import { generateVerificationToken, hashToken } from "../utils/helper.js";

const templateDir = path.join(process.cwd(), "src/templates");

const from = () => `${process.env.EMAIL_FROM_NAME || "TheRentalz"} <${process.env.EMAIL_FROM_ADDRESS}>`;

/** Render src/templates/<template>.ejs and send it. Reused by every email below. */
export const sendTemplateEmail = async ({ to, subject, template, data = {} }) => {
    const html = await ejs.renderFile(path.join(templateDir, `${template}.ejs`), {
        currentYear: new Date().getFullYear(),
        ...data,
    });
    await transporter.sendMail({ from: from(), to, subject, html });
    return true;
};

const VERIFICATION_EXPIRY_MINUTES = 30;

export const sendVerificationEmail = async (user) => {
    const token = generateVerificationToken(user.id);
    const expiryMinutes = VERIFICATION_EXPIRY_MINUTES;

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerificationTokenHash: hashToken(token),
            emailVerificationExpiry: new Date(Date.now() + expiryMinutes * 60 * 1000),
        },
    });

    return sendTemplateEmail({
        to: user.email,
        subject: "Verify your email - TheRentalz",
        template: "verification",
        data: {
            name: user.name,
            verificationUrl: `${process.env.CORS_ORIGIN}/verify?token=${token}`,
            expiryMinutes,
        },
    });
};

const VERIFICATION_RESEND_COOLDOWN_MS = 2 * 60 * 1000;

/**
 * Sends a verification email without ever throwing (a broken mail server must not block sign-up or login).
 * Skips the send if a link was issued in the last 2 minutes. Returns "sent" | "throttled" | "failed".
 */
export const trySendVerificationEmail = async (user) => {
    const issuedAt = user.emailVerificationExpiry ? user.emailVerificationExpiry.getTime() - VERIFICATION_EXPIRY_MINUTES * 60 * 1000 : 0;
    if (Date.now() - issuedAt < VERIFICATION_RESEND_COOLDOWN_MS) return "throttled";
    try {
        await sendVerificationEmail(user);
        return "sent";
    } catch (error) {
        console.error(`Verification email to user ${user.id} failed: ${error.message}`);
        await prisma.user.update({ where: { id: user.id }, data: { emailVerificationExpiry: null, emailVerificationTokenHash: null } }).catch(() => {});
        return "failed"; // cleared so the next attempt is not throttled
    }
};

export const sendPasswordResetEmail = async (user, resetToken) =>
    sendTemplateEmail({
        to: user.email,
        subject: "Reset your password - TheRentalz",
        template: "reset-password",
        data: {
            name: user.name,
            resetUrl: `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`,
            expiryMinutes: 15,
        },
    });

// Ad moderation emails (replaces legacy approve-ad / disapprove-add)
export const sendAdApprovedEmail = async (user, ad) =>
    sendTemplateEmail({
        to: user.email,
        subject: "Your ad has been approved",
        template: "ad-approved",
        data: { name: user.name, adTitle: ad.title, adUrl: `${process.env.CORS_ORIGIN}/ads/${ad.slug}` },
    });

export const sendAdRejectedEmail = async (user, ad, reason) =>
    sendTemplateEmail({
        to: user.email,
        subject: "Your ad was not approved",
        template: "ad-rejected",
        data: { name: user.name, adTitle: ad.title, reason },
    });

// Package purchase confirmation (replaces legacy purchase-ad)
export const sendPurchaseEmail = async (user, order) =>
    sendTemplateEmail({
        to: user.email,
        subject: "Your plan purchase is confirmed",
        template: "purchase-confirmation",
        data: { name: user.name, order },
    });

// Change of email address: the link goes to the NEW address, a heads-up to the OLD one
export const sendEmailChangeLink = async (user, newEmail, token, expiryMinutes) =>
    sendTemplateEmail({
        to: newEmail,
        subject: "Confirm your new email - TheRentalz",
        template: "email-change",
        data: { name: user.name, confirmUrl: `${process.env.CORS_ORIGIN}/confirm-email-change?token=${token}`, expiryMinutes },
    });

export const sendEmailChangeNotice = async (oldEmail, name, newEmail, { changed }) =>
    sendTemplateEmail({
        to: oldEmail,
        subject: changed ? "Your email address was changed - TheRentalz" : "Email change requested - TheRentalz",
        template: "email-change-notice",
        data: { name, newEmail, changed },
    });
