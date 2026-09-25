// Fail fast if required configuration is missing (all environments, no insecure fallbacks).
const required = [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_VERIFICATION_SECRET",
    "JWT_PASSWORD_RESET_SECRET",
    "CORS_ORIGIN",
];

export const validateEnv = () => {
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
};
