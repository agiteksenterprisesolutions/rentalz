import { ArrowUpRight, ImageOff, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AD_TYPE_LABELS, getAdPrice } from "@/utils/format";
import FavouriteButton from "./FavouriteButton";

// Listing card used on the home page, search results and the seller dashboard.
// The title link stretches over the whole card, so the card is one big click target.
export default function AdCard({ ad, priority = false, onFavouriteChange }) {
  const photo = ad.photos?.[0];
  const { text: price, unit } = getAdPrice(ad);
  const specs = [ad.make?.name, ad.modelYear, ad.mainCategory?.title].filter(Boolean);

  return (
    <article className="card card-interactive group relative flex h-full flex-col p-0">
      {/* The photo runs flush to the plate's edges; the clipped corner is the only thing that breaks it. */}
      <div className="card-media aspect-4/3 bg-surface-container-low">
        {photo ? (
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 92vw"
            priority={priority}
            className="object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-neutral-400">
            <ImageOff aria-hidden="true" className="size-8" />
          </div>
        )}
        {/* The tags sit on the photo with a clear margin, so they read as applied to the machine, not crammed into the corner. */}
        <div className="absolute left-space-md top-space-md flex gap-1.5">
          {ad.isFeatured && <span className="pill h-7 border-0 bg-amber px-2.5 text-on-amber">Featured</span>}
          <span className="pill h-7 border-0 bg-charcoal px-2.5 text-on-charcoal">{AD_TYPE_LABELS[ad.type] ?? ad.type}</span>
        </div>
      </div>
      <FavouriteButton adId={ad.id} title={ad.title} onChange={onFavouriteChange} className="absolute right-space-md top-space-md z-20" />

      <div className="flex flex-1 flex-col gap-space-sm p-space-lg">
        {ad.city && (
          <p className="type-label-mono-md flex items-center gap-1.5 text-neutral-700">
            <MapPin aria-hidden="true" className="size-3.5" />
            {ad.city.name}
          </p>
        )}
        <h3 className="type-headline-sm line-clamp-2">
          <Link href={`/ads/${ad.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {ad.title}
          </Link>
        </h3>
        {specs.length > 0 && (
          <div className="spec-strip">
            {specs.map((spec) => (
              <span key={spec}>{spec}</span>
            ))}
          </div>
        )}
        {/* The price is the plate's stamped figure, and the arrow stands in for a second click target. */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-neutral-200 pt-space-md">
          <div className="price">
            <span className="price-amount text-xl">{price}</span>
            {unit && <span className="price-unit">{unit}</span>}
          </div>
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 shrink-0 text-neutral-400 transition-all duration-200 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-900"
          />
        </div>
      </div>
    </article>
  );
}
