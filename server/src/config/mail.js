import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: Number(process.env.SMTP_PORT) === 465,
    ...(process.env.SMTP_USER && {
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    }),
});
