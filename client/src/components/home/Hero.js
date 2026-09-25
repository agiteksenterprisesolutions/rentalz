import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAdPrice } from "@/utils/format";
import SearchPanel from "./SearchPanel";

const POINTS = ["Every ad is reviewed before it goes live", "Call or WhatsApp the owner directly"];

export default function Hero({ spotlight, cities, categories, popular }) {
  const photo = spotlight?.photos?.[0];
  const price = spotlight ? getAdPrice(spotlight) : null;

  return (
    <section aria-labelledby="hero-title">
      <div className="container-page grid gap-space-xl pt-space-xl pb-space-2xl xl:grid-cols-2 xl:items-center xl:pt-space-2xl">
        <div className="flex flex-col items-start gap-space-lg">
          <h1 id="hero-title" className="type-display-xl max-w-xl uppercase">
            Rent &amp; buy equipment and vehicles across the UAE
          </h1>
          <p className="type-body-lg max-w-lg text-neutral-700">
            Browse listings from owners in every emirate. Compare daily, weekly and monthly rates, then contact the seller directly.
          </p>
          <ul className="flex flex-col gap-3">
            {/* {POINTS.map((point) => (
              <li key={point} className="type-body-md flex items-center gap-3 font-medium">
                <span className="flex size-6 items-center justify-center rounded-full bg-amber text-on-amber">
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))} */}
          </ul>
        </div>

        <div className="card-media aspect-4/3 rounded-3xl border border-neutral-200 shadow-resting">
          {photo && (
            <Image src={photo.url} alt="" fill priority sizes="(min-width: 1280px) 45vw, 92vw" className="object-cover" />
          )}
          {spotlight && (
            <Link
              href={`/ads/${spotlight.slug}`}
              className="panel-floating absolute inset-x-space-md bottom-space-md flex items-center justify-between gap-4 rounded-2xl px-space-md py-space-sm transition-shadow hover:shadow-hover"
            >
              <span className="min-w-0">
                <span className="eyebrow block">Featured now</span>
                <span className="type-headline-sm block truncate">{spotlight.title}</span>
              </span>
              <span className="price shrink-0">
                <span className="price-amount">{price.text}</span>
                {price.unit && <span className="price-unit">{price.unit}</span>}
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="container-page -mt-space-xl relative z-10">
        <SearchPanel cities={cities} categories={categories} popular={popular} />
      </div>
    </section>
  );
}
