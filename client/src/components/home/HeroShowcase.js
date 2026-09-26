"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const INTERVAL_MS = 7000;

// The hero grid. `intro` (eyebrow, headline, text) is rendered on the server and passed in; this component owns the
// changing part: the machine's details on the left and its photo on the right.
export default function HeroShowcase({ slides, intro }) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [manual, setManual] = useState(false);
  const many = slides.length > 1;
  const slide = slides[index];

  // Turns to the next machine by itself, unless the visitor chose one with the dots, is pointing at or focused inside the hero, or prefers reduced motion.
  useEffect(() => {
    if (!many || hovering || manual) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [many, hovering, manual, slides.length]);

  // Choosing a machine with the dots also stops the automatic turning, so the page never changes under the visitor's hand.
  const choose = (i) => {
    setManual(true);
    setIndex(i);
  };

  return (
    <>
      {/* Soft wash over the photo, strongest behind the text and fading out toward the machine (large screens) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden bg-linear-to-r from-canvas from-30% via-canvas/70 via-45% to-canvas/5 to-70% xl:block" />

      <div
        className="container-page flex flex-col gap-space-md py-space-2xl xl:flex-1 xl:pt-14 xl:pb-space-sm"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
      >
        <div className="grid gap-space-xl xl:flex-1 xl:items-center">
          <div className="flex flex-col items-start gap-space-md xl:max-w-[50%]">
            {intro}

            {/* The machine on show changes; the headline does not. Only this button follows the slide. */}
            <div className="mt-space-md flex flex-wrap items-center gap-space-md">
              <Link key={slide.slug} href={`/ads?category=${slide.slug}`} className="btn-angled hero-slide-in">
                Browse {slide.title}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/ads" className="btn btn-ghost">All listings</Link>
            </div>
          </div>

          {/* The machine. Below xl it sits under the text; from xl up it becomes the hero's background, on the right
              and above the search panel (the bottom offset leaves room for the dots and the search panel). */}
          <div key={slide.slug} className="hero-slide-in relative h-80 sm:h-104 xl:absolute xl:right-0 xl:bottom-64 xl:top-16 xl:-z-20 xl:h-auto xl:w-[50%]">
            <Image src={slide.image} alt={slide.alt} fill priority={index === 0} sizes="(min-width: 1280px) 50vw, 92vw" className="object-contain object-bottom drop-shadow-[0_24px_28px_rgb(23_21_15/0.25)] xl:object-right-bottom" />
          </div>
        </div>

        {many && (
          <ul className="flex items-center justify-center gap-2.5" aria-label="Choose a machine">
            {slides.map((s, i) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  aria-label={`Show ${s.title}, ${i + 1} of ${slides.length}`}
                  aria-current={i === index}
                  className={`block h-3 rounded-full border border-neutral-400 transition-all ${i === index ? "w-8 border-amber bg-amber" : "w-3 bg-transparent hover:bg-neutral-400"}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
