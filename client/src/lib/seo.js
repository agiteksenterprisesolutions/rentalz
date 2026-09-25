// Turns the admin-managed `seo.default` / `seo.pages` settings (GET /seo/settings) into Next.js metadata.
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const buildMetadata = (seo, pageKey, { path = "/", title, description } = {}) => {
  const base = seo?.["seo.default"] ?? {};
  const page = seo?.["seo.pages"]?.[pageKey] ?? {};

  const finalTitle = title || page.title || base.title || base.siteName || "TheRentalz";
  const finalDescription = description || page.description || base.description || undefined;
  const keywords = page.keywords?.length ? page.keywords : base.keywords;
  const image = page.ogImageUrl || base.ogImageUrl;

  return {
    title: { absolute: finalTitle },
    description: finalDescription,
    ...(keywords?.length && { keywords }),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: base.siteName || "TheRentalz",
      title: finalTitle,
      description: finalDescription,
      url: path,
      ...(image && { images: [image] }),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: finalTitle, description: finalDescription },
  };
};

/** JSON-LD for the whole site. `<` is escaped so the data can never close the script tag. */
export const jsonLd = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
