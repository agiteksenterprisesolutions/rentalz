import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdCard from "@/components/ads/AdCard";
import { getCategory, getSeoSettings, searchAds } from "@/lib/data";
import { buildMetadata, jsonLd, siteUrl } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found", robots: { index: false } };
  return buildMetadata(await getSeoSettings(), `category-${slug}`, {
    path: `/categories/${slug}`,
    title: `${category.title} for rent and sale in the UAE | TheRentalz`,
    description: `Rent or buy ${category.title.toLowerCase()} in the UAE. Compare prices from verified sellers and contact them directly on TheRentalz.`,
  });
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const { items, pagination } = await searchAds({ category: slug, limit: 6 });
  const crumbs = [...category.breadcrumb, category];
  const base = siteUrl();
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ title: "Home", path: "" }, { title: "Categories", path: "/categories" }, ...crumbs.map((c) => ({ title: c.title, path: `/categories/${c.slug}` }))].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      item: `${base}${c.path}`,
    })),
  };

  return (
    <div className="container-page py-space-xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <nav aria-label="Breadcrumb" className="type-label-mono-md flex flex-wrap gap-x-2 text-neutral-700">
        <Link href="/" className="hover:text-neutral-900">Home</Link> /
        <Link href="/categories" className="hover:text-neutral-900">Categories</Link>
        {category.breadcrumb.map((c) => (
          <span key={c.id} className="contents">/ <Link href={`/categories/${c.slug}`} className="hover:text-neutral-900">{c.title}</Link></span>
        ))}
        / <span aria-current="page">{category.title}</span>
      </nav>

      <header className="mb-space-xl mt-space-md">
        <h1 className="type-headline-lg">{category.title}</h1>
        <p className="type-body-md mt-space-sm text-neutral-700">
          {pagination.total > 0 ? `${pagination.total.toLocaleString("en-US")} ${pagination.total === 1 ? "listing" : "listings"} available across the UAE.` : "No listings in this category yet."}
        </p>
      </header>

      {category.children.length > 0 && (
        <section aria-labelledby="sub" className="mb-space-2xl">
          <h2 id="sub" className="type-headline-md mb-space-md">Browse {category.title.toLowerCase()}</h2>
          <ul className="grid gap-space-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.children.map((child) => (
              <li key={child.id}>
                <Link href={`/categories/${child.slug}`} className="card card-interactive group flex items-center justify-between gap-2 p-space-md">
                  <span className="type-body-md font-medium">{child.title}</span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="listings">
        <div className="mb-space-md flex flex-wrap items-end justify-between gap-space-md">
          <h2 id="listings" className="type-headline-md">Latest in {category.title}</h2>
          {pagination.total > items.length && <Link href={`/ads?category=${slug}`} className="btn btn-secondary btn-sm">View all {pagination.total}</Link>}
        </div>
        {items.length > 0 ? (
          <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-3">{items.map((ad) => <AdCard key={ad.id} ad={ad} />)}</div>
        ) : (
          <div className="card flex flex-col items-center gap-space-md p-space-xl text-center">
            <p className="type-body-md text-neutral-700">Nothing listed here yet. Have equipment like this?</p>
            <Link href="/dashboard/ads/new" className="btn btn-primary">Post an ad</Link>
          </div>
        )}
      </section>
    </div>
  );
}
