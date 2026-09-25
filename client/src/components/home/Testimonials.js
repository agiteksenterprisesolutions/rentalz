import { Quote } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

// Client quotes as published on the previous TheRentalz website.
const TESTIMONIALS = [
  {
    quote:
      "I was skeptical about renting equipment online at first, but this marketplace made the process incredibly easy and hassle-free. The equipment was in great condition, and the rental process was seamless. I'll definitely be using this platform again!",
    company: "Emirates Link Maltarou LLC",
    place: "Abu Dhabi, UAE",
    role: "Head of Logistics and Operations",
  },
  {
    quote:
      "I needed to rent some specialized equipment for a one-time project, and I was having a hard time finding what I needed at a local rental shop. This online marketplace had exactly what I was looking for, and the rental rates were very reasonable. I was impressed with the variety of equipment available on the platform.",
    company: "Bin Ahmed Contracting LLC",
    place: "Abu Dhabi",
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="clients-title" className="section container-page">
      <SectionHeading id="clients-title" eyebrow="Testimonials" title="What our clients say" align="center" />
      <ul className="mt-space-xl grid gap-gutter-mobile md:grid-cols-2 md:gap-gutter">
        {TESTIMONIALS.map((item) => (
          <li key={item.company}>
            <figure className="card flex h-full flex-col gap-space-lg p-space-lg md:p-space-xl">
              <Quote aria-hidden="true" className="size-8 text-amber" />
              <blockquote className="type-body-lg">{item.quote}</blockquote>
              <figcaption className="mt-auto border-t border-neutral-200 pt-space-md">
                <span className="type-headline-sm block">{item.company}</span>
                <span className="type-label-mono-md text-neutral-700">
                  {[item.role, item.place].filter(Boolean).join(" · ")}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
