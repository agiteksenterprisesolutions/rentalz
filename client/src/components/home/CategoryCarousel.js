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
              {/* A filled plate with the brand's clipped corner; the whole tile goes amber on hover. */}
              <Link
                href={`/ads?category=${category.slug}`}
                className="corner-cut group flex h-full min-h-40 flex-col gap-space-lg bg-surface-container-low p-space-md transition-colors duration-200 ease-soft hover:bg-amber hover:text-on-amber"
              >
                <Icon aria-hidden="true" className="size-8 text-neutral-900 transition-colors group-hover:text-on-amber" strokeWidth={1.5} />
                <span className="mt-auto flex items-end justify-between gap-2">
                  <span className="type-headline-sm">{category.title}</span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-on-amber" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
