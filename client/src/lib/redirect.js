// The `next` query value is user-controlled. Only same-site paths are allowed, so a crafted login link
// can't send someone to another site after they sign in.
export const safeNextPath = (value, fallback = "/dashboard") =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
