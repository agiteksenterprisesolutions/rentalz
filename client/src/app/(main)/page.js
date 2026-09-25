import TrustSection from "@/components/home/TrustSection";
import CategoryCarousel from "@/components/home/CategoryCarousel";
import FeaturedListings from "@/components/home/FeaturedListings";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import SellCta from "@/components/home/SellCta";
import Testimonials from "@/components/home/Testimonials";
import SectionHeading from "@/components/ui/SectionHeading";
import { getAdTotal, getCategoryTree, getCities, getFeaturedAds, getMakes, getPopularCategories, getSeoSettings, getStartingPackagePrice } from "@/lib/data";
import { buildMetadata, jsonLd, siteUrl } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata(await getSeoSettings(), "home", { path: "/" });
}

export default async function HomePage() {
  const [seo, cities, makes, categoryTree, popular, featured, total, startingPrice] = await Promise.all([
    getSeoSettings(),
    getCities(),
    getMakes(),
    getCategoryTree(),
    getPopularCategories(),
    getFeaturedAds(8),
    getAdTotal(),
    getStartingPackagePrice(),
  ]);

  const site = siteUrl();
  const siteName = seo["seo.default"]?.siteName || "TheRentalz";
  const structuredData = [
    { "@context": "https://schema.org", "@type": "Organization", name: siteName, url: site },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: site,
      potentialAction: { "@type": "SearchAction", target: `${site}/ads?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <Hero spotlight={featured.find((ad) => ad.photos?.length)} cities={cities} categories={categoryTree} popular={popular.slice(0, 5)} />


      {popular.length > 0 && (
        <section aria-labelledby="categories-title" className="section container-page">
          <CategoryCarousel categories={popular} />
        </section>
      )}

      {featured.length > 0 && (
        <section aria-labelledby="featured-title" className="section bg-surface-container-low">
          <div className="container-page">
            <SectionHeading id="featured-title" eyebrow="Featured" title="Featured listings" />
            <div className="mt-space-lg">
              <FeaturedListings ads={featured} total={total} />
            </div>
          </div>
        </section>
      )}

      <TrustSection cities={cities} categoryTree={categoryTree} makes={makes} />
      <HowItWorks />
      <Testimonials />
      <SellCta startingPrice={startingPrice} />
    </>
  );
}
