import { Heart, PhoneCall, Search } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  { icon: Search, title: "Search and filter", text: "Narrow by category, emirate, make, price and year. Check operator, insurance and warranty options." },
  { icon: Heart, title: "Compare and save", text: "See daily, weekly and monthly prices together and keep your shortlist in favourites." },
  { icon: PhoneCall, title: "Contact the owner", text: "Call or message the seller directly to agree dates, price and delivery." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="section container-page scroll-mt-24">
      <SectionHeading id="how-title" eyebrow="How it works" title="Three simple steps" description="From search to site delivery, you deal directly with the owner." align="center" />
      <ol className="mt-space-xl grid gap-gutter-mobile md:grid-cols-3 md:gap-gutter">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="card flex flex-col gap-space-md p-space-lg">
            <div className="flex items-center justify-between">
              <span className="flex size-12 items-center justify-center rounded-xl bg-amber text-on-amber">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
              </span>
              <span className="type-label-mono-md text-neutral-400">Step 0{index + 1}</span>
            </div>
            <h3 className="type-headline-sm">{title}</h3>
            <p className="type-body-md text-neutral-700">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
