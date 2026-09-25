"use client";

import { ArrowRight, ArrowUpFromLine, BrickWall, Building2, ChevronLeft, ChevronRight, Construction, Forklift, Tractor, Truck, Zap } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

const ICONS = {
  "earth-moving": Tractor,
  "aerial-work-platforms": ArrowUpFromLine,
  "forklifts-material-handling": Forklift,
  "power-solutions": Zap,
  "concrete-and-masonry": BrickWall,
  "vehicle-and-trailers": Truck,
  scaffolding: Building2,
  compaction: Construction,
};

export default function CategoryCarousel({ categories }) {
  const track = useRef(null);
  const scroll = (direction) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div>
      <div className="flex items-end justify-between gap-space-md">
        <SectionHeading id="categories-title" eyebrow="Browse by category" title="Most popular categories" />
        <div className="flex shrink-0 gap-2">
        <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label="Previous categories" onClick={() => scroll(-1)}>
          <ChevronLeft />
        </button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label="Next categories" onClick={() => scroll(1)}>
          <ChevronRight />
        </button>
        </div>
      </div>

      <ul ref={track} className="mt-space-md -mx-space-xs flex snap-x snap-mandatory gap-gutter-mobile overflow-x-auto px-space-xs pb-space-md md:gap-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const Icon = ICONS[category.slug] ?? Construction;
          return (
            <li key={category.id} className="w-[13rem] shrink-0 snap-start md:w-[15rem]">
              <Link href={`/ads?category=${category.slug}`} className="card card-interactive group flex h-full flex-col gap-space-lg">
                <span className="flex size-14 items-center justify-center rounded-xl bg-surface-container-low text-neutral-900 transition-colors group-hover:bg-amber group-hover:text-on-amber">
                  <Icon aria-hidden="true" className="size-7" strokeWidth={1.75} />
                </span>
                <span className="mt-auto flex items-end justify-between gap-2">
                  <span className="type-headline-sm">{category.title}</span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-neutral-900" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
