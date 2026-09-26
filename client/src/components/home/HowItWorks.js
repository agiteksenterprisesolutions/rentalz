import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  { title: "Search and filter", text: "Narrow by category, emirate, make, price and year. Check operator, insurance and warranty options." },
  { title: "Compare and save", text: "See daily, weekly and monthly prices together and keep your shortlist in favourites." },
  { title: "Contact the owner", text: "Call or message the seller directly, with no agent and no commission in between." },
  { title: "Agree and take delivery", text: "Settle the rate and the dates, then arrange collection or delivery straight to your site." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="section container-page scroll-mt-24">
      <SectionHeading id="how-title" eyebrow="How it works" title="Four simple steps" description="From search to site delivery, you deal directly with the owner." />

      {/* Four quadrants around a cross of hairlines. The figure in the middle sits on the page colour,
          which is what opens the gap where the two rules would otherwise meet. */}
      <div className="relative mt-space-xl">
        <ol className="grid md:grid-cols-2">
          {STEPS.map(({ title, text }, index) => (
            <li
              key={title}
              className={`flex flex-col items-center gap-space-md border-t border-neutral-200 px-space-md py-space-xl text-center md:border-t-0 md:px-space-xl md:py-space-2xl ${
                index % 2 === 0 ? "md:border-r md:border-neutral-200" : ""
              } ${index < 2 ? "md:border-b md:border-neutral-200" : ""}`}
            >
              <span className="flex size-11 items-center justify-center bg-surface-container-high font-mono text-sm font-bold text-neutral-900">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="type-headline-sm">{title}</h3>
              <p className="type-body-md max-w-xs text-neutral-700">{text}</p>
            </li>
          ))}
        </ol>

        <p
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 select-none flex-col items-center bg-canvas px-space-xl py-space-md md:flex"
        >
          <span className="figure-ghost font-display text-[8.5rem] leading-none font-bold">04</span>
          <span className="-mt-14 font-display text-xl font-bold tracking-[0.22em] text-neutral-900 uppercase">Steps</span>
        </p>
      </div>
    </section>
  );
}
