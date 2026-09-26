import Link from "next/link";
import { formatAed } from "@/utils/format";
import { POST_AD_HREF } from "@/layout/navigation";

export default function SellCta({ startingPrice }) {
  return (
    <section aria-labelledby="sell-title" className="section container-page">
      <div className="scheme-light corner-cut-lg bg-amber">
        <div aria-hidden="true" className="hazard-rule" />
        <div className="flex flex-col items-start justify-between gap-space-xl p-space-lg md:p-space-2xl xl:flex-row xl:items-center">
        <div className="flex max-w-2xl flex-col gap-space-md">
          <p className="type-label-mono-md tracking-[0.16em] text-neutral-900/70">For sellers and owners</p>
          <h2 id="sell-title" className="type-display-xl uppercase">
            Put your idle equipment to work
          </h2>
          <p className="type-body-lg text-neutral-900/80">
            List a machine, truck or trailer in minutes and reach buyers and renters across the UAE.
            {startingPrice ? ` Single ads start at ${formatAed(startingPrice)}, with featured placement available.` : " Featured placement is available."}
          </p>
        </div>
        <div className="flex flex-wrap gap-space-md">
          <Link href={POST_AD_HREF} className="btn btn-secondary btn-lg">
            Post an ad
          </Link>
          <Link href="/packages" className="btn btn-lg bg-white text-neutral-900 hover:bg-canvas">
            View packages
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}
