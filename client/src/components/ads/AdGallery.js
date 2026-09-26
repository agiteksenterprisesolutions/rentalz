"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Main photo plus a thumbnail strip. Thumbnails are real buttons, so the gallery works with a keyboard.
export default function AdGallery({ photos, title }) {
  const [active, setActive] = useState(0);

  if (!photos.length) {
    return (
      <div className="card-media flex aspect-3/2 items-center justify-center text-neutral-400">
        <ImageOff aria-hidden="true" className="size-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-sm">
      {/* A photographic well rather than a white box: whatever the photo's shape, the frame reads as one plate. */}
      <div className="card-media aspect-3/2">
        <Image
          key={photos[active].id}
          src={photos[active].url}
          alt={`${title}, photo ${active + 1} of ${photos.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-contain"
        />
      </div>
      {photos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Photos">
          {photos.map((photo, i) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={`relative block size-20 overflow-hidden rounded-control border-2 bg-white transition-colors ${i === active ? "border-amber" : "border-neutral-200 hover:border-outline-variant"}`}
              >
                <Image src={photo.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
