"use client";

import Link from "next/link";
import { useState } from "react";
import AdCard from "@/components/ads/AdCard";

const TABS = [
  { id: "all", label: "All", match: () => true },
  { id: "rent", label: "For rent", match: (ad) => ad.type === "RENT" },
  { id: "sale", label: "For sale", match: (ad) => ad.type !== "RENT" },
];

export default function FeaturedListings({ ads, total }) {
  const [tab, setTab] = useState("all");
  const visible = ads.filter(TABS.find((t) => t.id === tab).match).slice(0, 4);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <div role="tablist" aria-label="Featured listings" className="segmented">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="segmented-item" onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <Link href="/ads" className="link type-body-md">
          View all{total ? ` ${total}` : ""} listings
        </Link>
      </div>

      {visible.length > 0 ? (
        <ul className="mt-space-lg grid gap-gutter-mobile sm:grid-cols-2 md:gap-gutter xl:grid-cols-4">
          {visible.map((ad) => (
            <li key={ad.id}>
              <AdCard ad={ad} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="card type-body-md mt-space-lg text-neutral-700">No featured listings in this group right now. Try another tab or browse every listing.</p>
      )}
    </div>
  );
}
