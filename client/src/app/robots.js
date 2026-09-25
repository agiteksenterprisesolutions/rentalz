import { siteUrl } from "@/lib/seo";

// Private and account pages are also marked noindex on the pages themselves; this keeps crawlers from fetching them.
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/cart", "/checkout", "/api/", "/login", "/register", "/forgot-password", "/reset-password", "/verify", "/confirm-email-change", "/design-system"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
