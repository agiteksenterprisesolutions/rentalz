import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { POST_AD_HREF } from "@/layout/navigation";

const countCategories = (tree) => tree.reduce((sum, node) => sum + 1 + countCategories(node.children ?? []), 0);

// Figures come from the live catalogue (cities, categories, makes), not from marketing copy.
export default function TrustSection({ cities, categoryTree, makes }) {
  const stats = [
    { value: cities.length, label: "Cities and emirates", text: "Owners list where the work is, from Abu Dhabi to Fujairah." },
    { value: countCategories(categoryTree), label: "Equipment categories", text: "Earth moving, lifting, power, scaffolding, trailers and more." },
    { value: makes.length, label: "Makes to choose from", text: "Filter by make, model year, operator, insurance and warranty." },
    { value: "100%", label: "Ads reviewed", text: "Every ad is checked by our team before it goes live." },
  ].filter((stat) => stat.value);

  return (
    <section aria-labelledby="trust-title" className="on-dark bg-charcoal text-white">
      <div className="container-page grid gap-space-xl py-space-2xl xl:grid-cols-2 xl:items-center xl:gap-space-2xl xl:py-26">
        <div className="flex flex-col items-start gap-space-lg">
          <SectionHeading
            id="trust-title"
            eyebrow="Why TheRentalz"
            title="Real listings. Direct contact. No middlemen."
            description="Compare daily, weekly and monthly rates, then call or WhatsApp the owner to agree dates, price and delivery yourself."
            inverse
          />
          <div className="flex flex-wrap gap-space-md">
            <Link href="/ads" className="btn btn-primary">
              Browse equipment
            </Link>
            <Link href={POST_AD_HREF} className="btn btn-ghost-inverse">
              Post an ad
            </Link>
          </div>
        </div>

        {/* Figures on a rule, like a data plate: no boxes, and the numbers carry the same mono as the prices. */}
        <dl className="grid gap-x-gutter gap-y-space-lg sm:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-space-xs border-t border-white/25 pt-space-md">
              <dd className="order-1 font-mono text-[2.75rem] leading-none font-bold tracking-tight text-amber">{stat.value}</dd>
              <dt className="order-2 type-headline-sm mt-space-sm">{stat.label}</dt>
              <dd className="order-3 type-body-sm text-white/60">{stat.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
