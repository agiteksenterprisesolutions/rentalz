import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdCard from "@/components/ads/AdCard";
import AdGallery from "@/components/ads/AdGallery";
import FavouriteButton from "@/components/ads/FavouriteButton";
import ContactButtons from "@/components/ads/ContactButtons";
import { getAd, searchAds } from "@/lib/data";
import { jsonLd, siteUrl } from "@/lib/seo";
import { AD_TYPE_LABELS, formatAed, OPERATOR_LABELS, yesNo } from "@/utils/format";

const loadAd = async (params) => getAd((await params).slug);

export async function generateMetadata({ params }) {
  const ad = await loadAd(params);
  if (!ad) return { title: "Listing not found", robots: { index: false } };

  const where = [ad.city?.name, "UAE"].filter(Boolean).join(", ");
  const description = `${ad.title}: ${AD_TYPE_LABELS[ad.type]?.toLowerCase() ?? "listing"} in ${where}. ${ad.description ?? ""}`.replace(/\s+/g, " ").slice(0, 160);
  const image = ad.photos?.[0]?.url;
  return {
    title: `${ad.title} in ${ad.city?.name ?? "the UAE"} | TheRentalz`,
    description,
    alternates: { canonical: `/ads/${ad.slug}` },
    openGraph: { type: "website", title: ad.title, description, url: `/ads/${ad.slug}`, ...(image && { images: [image] }) },
    twitter: { card: image ? "summary_large_image" : "summary", title: ad.title, description },
    // A listing that is not public (owner preview) must not be indexed.
    ...(ad.status !== "APPROVED" && { robots: { index: false, follow: false } }),
  };
}

const TIERS = [
  ["dailyPrice", "Daily"],
  ["weeklyPrice", "Weekly"],
  ["monthlyPrice", "Monthly"],
];

export default async function AdDetailPage({ params }) {
  const ad = await loadAd(params);
  if (!ad) notFound();

  const tiers = TIERS.filter(([key]) => Number(ad[key]) > 0);
  const specs = [
    ["Make", ad.make?.name],
    ["Model", ad.model],
    ["Year", ad.modelYear],
    ["Capacity", ad.capacity],
    ["Operator", OPERATOR_LABELS[ad.operator]],
    ["Insurance included", yesNo(ad.insurance)],
    ["Warranty", yesNo(ad.warranty)],
    ["Transportation", yesNo(ad.transportation)],
    // Legacy data holds numeric fuel codes; only show a readable value.
    ["Fuel", ad.fuelType && !/^\d+$/.test(ad.fuelType) ? ad.fuelType : null],
    ["Location", [ad.address, ad.city?.name].filter((v, i, a) => v && a.indexOf(v) === i).join(", ") || null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  const crumbs = [ad.mainCategory, ad.subCategory, ad.leafCategory].filter(Boolean);
  // Similar listings: the narrowest category that has other ads, then wider ones.
  let related = [];
  for (const category of [ad.leafCategory, ad.subCategory, ad.mainCategory].filter(Boolean)) {
    related = (await searchAds({ category: category.slug, limit: 5 })).items.filter((item) => item.id !== ad.id).slice(0, 3);
    if (related.length) break;
  }

  const memberSince = ad.user?.createdAt ? new Date(ad.user.createdAt).getFullYear() : null;
  const terms = ad.terms && !/^(yes|no)$/i.test(ad.terms.trim()) ? ad.terms : null;
  const base = siteUrl();

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: ad.title,
      description: ad.description || undefined,
      image: ad.photos?.map((p) => p.url),
      brand: ad.make?.name ? { "@type": "Brand", name: ad.make.name } : undefined,
      model: ad.model || undefined,
      category: crumbs.at(-1)?.title,
      offers: {
        "@type": "Offer",
        priceCurrency: ad.currency || "AED",
        price: Number(ad.price),
        availability: "https://schema.org/InStock",
        url: `${base}/ads/${ad.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Home", url: base },
        { name: "Listings", url: `${base}/ads` },
        ...crumbs.map((c) => ({ name: c.title, url: `${base}/ads?category=${c.slug}` })),
        { name: ad.title, url: `${base}/ads/${ad.slug}` },
      ].map((item, i) => ({ "@type": "ListItem", position: i + 1, ...item })),
    },
  ];

  return (
    <div className="container-page py-space-xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      {ad.status !== "APPROVED" && (
        <p role="status" className="pill mb-space-md">
          Preview only. This listing is {ad.status.toLowerCase()} and is not visible to the public.
        </p>
      )}

      <nav aria-label="Breadcrumb" className="type-label-mono-md flex flex-wrap gap-x-2 text-neutral-700">
        <Link href="/" className="hover:text-neutral-900">Home</Link> /
        <Link href="/ads" className="hover:text-neutral-900">Listings</Link>
        {crumbs.map((c) => (
          <span key={c.id} className="contents">
            / <Link href={`/ads?category=${c.slug}`} className="hover:text-neutral-900">{c.title}</Link>
          </span>
        ))}
      </nav>

      <div className="mt-space-lg grid gap-space-lg lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-space-xl">
          <AdGallery photos={ad.photos ?? []} title={ad.title} />

          <section aria-labelledby="specs">
            <h2 id="specs" className="type-headline-md mb-space-md">Specifications</h2>
            {specs.length > 0 ? (
              <dl className="card grid divide-y divide-neutral-200 sm:grid-cols-2 sm:divide-y-0">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 border-neutral-200 px-space-md py-space-sm sm:border-b sm:[&:nth-last-child(-n+2)]:border-b-0">
                    <dt className="type-label-mono-md text-neutral-700 uppercase">{label}</dt>
                    <dd className="type-body-md text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="type-body-md text-neutral-700">The seller hasn&apos;t added specifications.</p>
            )}
          </section>

          {ad.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="type-headline-md mb-space-md">About this listing</h2>
              <p className="type-body-lg max-w-prose whitespace-pre-line text-neutral-900">{ad.description}</p>
            </section>
          )}

          {terms && (
            <section aria-labelledby="terms">
              <h2 id="terms" className="type-headline-md mb-space-md">Seller terms</h2>
              <p className="type-body-md max-w-prose whitespace-pre-line text-neutral-700">{terms}</p>
            </section>
          )}
        </div>

        <aside className="card max-lg:order-first flex flex-col gap-space-md p-space-lg lg:sticky lg:top-24">
          <div className="flex flex-wrap gap-2">
            <span className="pill pill-sm">{AD_TYPE_LABELS[ad.type] ?? ad.type}</span>
            {ad.isFeatured && <span className="pill pill-available pill-sm">Featured</span>}
          </div>
          <h1 className="type-headline-lg">{ad.title}</h1>
          {ad.city && (
            <p className="type-label-mono-md flex items-center gap-1.5 text-neutral-700">
              <MapPin aria-hidden="true" className="size-3.5" />
              {ad.city.name}
            </p>
          )}

          <div className="border-y border-neutral-200 py-space-md">
            {tiers.length > 0 ? (
              <ul className="flex flex-col gap-space-sm">
                {tiers.map(([key, label]) => (
                  <li key={key} className="flex items-baseline justify-between gap-3">
                    <span className="type-label-mono-md text-neutral-700 uppercase">{label}</span>
                    <span className="price"><span className="price-amount">{formatAed(ad[key])}</span></span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="price"><span className="price-amount">{formatAed(ad.price)}</span></p>
            )}
          </div>

          <FavouriteButton adId={ad.id} title={ad.title} withLabel className="w-full" />
          {ad.phone ? <ContactButtons adId={ad.id} phone={ad.phone} title={ad.title} /> : <p className="type-body-sm text-neutral-700">The seller hasn&apos;t shared a phone number.</p>}

          <div className="flex flex-col gap-2 border-t border-neutral-200 pt-space-md type-body-sm text-neutral-700">
            {ad.user?.name && (
              <p className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4" />Listed by {ad.user.name}</p>
            )}
            {memberSince && (
              <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4" />Member since {memberSince}</p>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-space-2xl">
          <h2 id="related" className="type-headline-md mb-space-md">Similar listings</h2>
          <div className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <AdCard key={item.id} ad={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
