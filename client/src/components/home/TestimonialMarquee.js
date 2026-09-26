"use client";

import { Star } from "lucide-react";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

// How many cards a row needs before it is wide enough to travel across the screen.
const MIN_ROW_LENGTH = 4;
// Rows split in two only once there are enough quotes that the second row is not a repeat of the first.
const TWO_ROW_THRESHOLD = 6;

const initialsOf = (name) =>
  name
    .replace(/\b(LLC|L\.L\.C\.?|Ltd|Contracting|Company|Co\.?)\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

function TestimonialCard({ item, duplicate }) {
  return (
    <li aria-hidden={duplicate || undefined} className="w-80 shrink-0 snap-start md:w-96">
      <figure className="card flex h-full flex-col gap-space-md p-space-lg">
        <div className="flex items-center gap-space-md">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center bg-charcoal font-display text-sm font-bold text-on-charcoal">
            {initialsOf(item.company)}
          </span>
          <div className="min-w-0">
            <figcaption className="type-headline-sm truncate">{item.company}</figcaption>
            <p className="type-label-mono-md text-neutral-700">{[item.role, item.place].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <blockquote className="type-body-md text-neutral-700">{item.quote}</blockquote>
        <p className="mt-auto flex gap-1 text-amber" aria-label={`Rated ${item.rating} out of 5`}>
          {Array.from({ length: item.rating }, (_, i) => (
            <Star key={i} aria-hidden="true" className="size-4 fill-current" strokeWidth={0} />
          ))}
        </p>
      </figure>
    </li>
  );
}

// One row of quotes. The row is laid out twice end to end, so moving it exactly half its width
// lands on the copy and the loop never shows a seam.
function MarqueeRow({ items, reverse = false, still }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const distance = useTransform(scrollYProgress, [0, 1], reverse ? [-50, 0] : [0, -50]);
  const smoothed = useSpring(distance, { stiffness: 70, damping: 22, mass: 0.35 });
  const x = useMotionTemplate`${smoothed}%`;

  // With reduced motion the row holds still, so it becomes an ordinary sideways scroller instead.
  return (
    <div ref={ref} className={`edge-fade ${still ? "snap-x overflow-x-auto px-margin-mobile" : "overflow-hidden"}`}>
      <motion.ul className="flex w-max gap-gutter-mobile py-1 md:gap-gutter" style={still ? undefined : { x }}>
        {items.map((item, i) => (
          <TestimonialCard key={`a-${i}`} item={item} />
        ))}
        {items.map((item, i) => (
          <TestimonialCard key={`b-${i}`} item={item} duplicate />
        ))}
      </motion.ul>
    </div>
  );
}

// The rows travel with the page: scrolling down carries them forward, scrolling back up rewinds them.
export default function TestimonialMarquee({ testimonials }) {
  const still = useReducedMotion();

  const fill = (source) => {
    const row = [];
    while (row.length < MIN_ROW_LENGTH) row.push(...source);
    return row;
  };

  const twoRows = testimonials.length >= TWO_ROW_THRESHOLD;
  const half = Math.ceil(testimonials.length / 2);

  return (
    <div className="flex flex-col gap-gutter-mobile md:gap-gutter">
      <MarqueeRow items={fill(twoRows ? testimonials.slice(0, half) : testimonials)} still={still} />
      {twoRows && <MarqueeRow items={fill(testimonials.slice(half))} reverse still={still} />}
    </div>
  );
}
