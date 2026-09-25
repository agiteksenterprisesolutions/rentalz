import { ImageOff, MapPin } from "lucide-react";
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
    <article className="card card-interactive group relative flex h-full flex-col gap-space-md p-space-sm">
      <div className="card-media">
        {photo ? (
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 92vw"
            priority={priority}
            className="object-cover transition-transform duration-300 ease-soft group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-neutral-400">
            <ImageOff aria-hidden="true" className="size-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {ad.isFeatured && <span className="pill pill-available pill-sm bg-white">Featured</span>}
          <span className="pill pill-sm bg-white">{AD_TYPE_LABELS[ad.type] ?? ad.type}</span>
        </div>
        <FavouriteButton adId={ad.id} title={ad.title} onChange={onFavouriteChange} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-space-sm px-space-sm pb-space-sm">
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
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-neutral-200 pt-space-md">
          <div className="price">
            <span className="price-amount">{price}</span>
            {unit && <span className="price-unit">{unit}</span>}
          </div>
          <span aria-hidden="true" className="btn btn-secondary btn-sm">
            View details
          </span>
        </div>
      </div>
    </article>
  );
}
