import SectionHeading from "@/components/ui/SectionHeading";
import TestimonialMarquee from "./TestimonialMarquee";

// Client quotes as published on the previous TheRentalz website, with the ratings they carried there.
const TESTIMONIALS = [
  {
    quote:
      "I was skeptical about renting equipment online at first, but this marketplace made the process incredibly easy and hassle-free. The equipment was in great condition, and the rental process was seamless. I'll definitely be using this platform again!",
    company: "Emirates Link Maltarou LLC",
    place: "Abu Dhabi, UAE",
    role: "Head of Logistics and Operations",
    rating: 5,
  },
  {
    quote:
      "I needed to rent some specialized equipment for a one-time project, and I was having a hard time finding what I needed at a local rental shop. This online marketplace had exactly what I was looking for, and the rental rates were very reasonable. I was impressed with the variety of equipment available on the platform.",
    company: "Bin Ahmed Contracting LLC",
    place: "Abu Dhabi",
    role: "CEO",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="clients-title" className="section">
      <div className="container-page mb-space-xl">
        <SectionHeading id="clients-title" eyebrow="Testimonials" title="What our clients say" description="Owners and hirers who have already worked through TheRentalz." />
      </div>
      <TestimonialMarquee testimonials={TESTIMONIALS} />
    </section>
  );
}
