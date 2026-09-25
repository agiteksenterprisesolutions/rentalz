"use client";

import { Check, Minus, Star } from "lucide-react";
import { useState } from "react";
import { formatAed } from "@/utils/format";
import AddToCart from "./AddToCart";
import { baseOf, coverage, durationText, isSingle, optionLabel, perAdText } from "./plansData";

const FILTERS = [
  { id: "all", label: "All plans" },
  { id: "single", label: "Single ad" },
  { id: "business", label: "Business plans" },
];

const Yes = ({ label }) => (
  <span className="inline-flex items-center gap-1.5">
    <Check aria-hidden="true" className="size-4 text-amber-deep" />
    <span className={label ? "type-body-sm" : "sr-only"}>{label || "Included"}</span>
  </span>
);
const No = () => (
  <span className="inline-flex">
    <Minus aria-hidden="true" className="size-4 text-neutral-400" />
    <span className="sr-only">Not included</span>
  </span>
);

function TierCard({ group, index, highlight }) {
  const base = baseOf(group);
  const featured = group.packages.map((p) => p.featuredDays).filter((d) => d > 0).sort((a, b) => a - b);
  const stats = coverage(group.packages, "hasAnalytics");
  const support = coverage(group.packages, "hasSupport");
  const perAd = perAdText(base);
  const lines = [
    `${base.adCount} ${base.adCount === 1 ? "ad" : "ads"}, each live for ${durationText(base)}`,
    featured.length ? `Featured options: ${featured.join(", ")} days` : null,
    stats ? `Views and contact statistics (${stats.toLowerCase()})` : null,
    support ? "Seller support" : null,
  ].filter(Boolean);

  // Inside the dark card the usual grey text would be too faint, so muted text switches to translucent white.
  const muted = highlight ? "text-white/60" : "text-neutral-700";
  return (
    <article className={`flex flex-col gap-space-md p-space-lg ${highlight ? "card-dark" : "card"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`type-label-mono-md uppercase ${muted}`}>Tier {String(index + 1).padStart(2, "0")}</p>
        {highlight && <span className="pill pill-available pill-sm"><Star aria-hidden="true" className="size-3" />Best value</span>}
      </div>
      <h3 className="type-headline-sm sm:min-h-14">{group.title}</h3>
      <div>
        <p className={`type-label-mono-md uppercase ${muted}`}>From</p>
        <p className="price"><span className="price-amount">{formatAed(base.amount)}</span></p>
        <p className={`type-body-sm ${muted}`}>{perAd ?? "one ad"}</p>
      </div>
      <ul className={`flex flex-1 flex-col gap-2 border-t pt-space-md ${highlight ? "border-white/15" : "border-neutral-200"}`}>
        {lines.map((line) => (
          <li key={line} className="type-body-sm flex items-start gap-2">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-deep" />
            {line}
          </li>
        ))}
      </ul>
      <a href={`#plan-group-${group.id}`} aria-label={`Select a ${group.title} plan`} className={`btn w-full ${highlight ? "btn-primary" : "btn-secondary"}`}>Select plan</a>
    </article>
  );
}

function MatrixGroup({ group, number }) {
  const packages = [...group.packages].sort((a, b) => a.featuredDays - b.featuredDays);
  const base = baseOf(group);
  return (
    <>
      <tr id={`plan-group-${group.id}`} className="scroll-mt-28 bg-surface-container-low">
        <th scope="colgroup" colSpan={7} className="px-space-md py-space-sm text-left">
          <span className="type-label-mono-md uppercase text-amber-ink">Group {number}</span>
          <span className="font-display text-sm font-semibold"> · {group.title}</span>
          <span className="type-body-sm text-neutral-700"> · {base.adCount} {base.adCount === 1 ? "ad" : "ads"}</span>
        </th>
      </tr>
      {packages.map((p) => (
        <tr key={p.id} className="border-t border-neutral-200">
          <th scope="row" className="sticky left-0 z-10 bg-white px-space-md py-space-md text-left font-display text-sm font-semibold">
            {optionLabel(p.featuredDays)}
          </th>
          <td className="type-body-md px-space-md py-space-md text-center">{p.adCount}</td>
          <td className="type-body-md px-space-md py-space-md text-center">{p.featuredDays > 0 ? `${p.featuredDays} days` : <No />}</td>
          <td className="type-body-md px-space-md py-space-md text-center">{durationText(p)}</td>
          <td className="px-space-md py-space-md text-center">{p.hasAnalytics ? <Yes /> : <No />}</td>
          <td className="px-space-md py-space-md text-center">{p.hasSupport ? <Yes /> : <No />}</td>
          <td className="px-space-md py-space-md">
            <div className="flex items-center justify-end gap-space-md">
              <div className="text-right">
                <p className="price"><span className="price-amount">{formatAed(p.amount)}</span></p>
                {perAdText(p) && <p className="type-body-sm text-neutral-700">{perAdText(p)}</p>}
              </div>
              <div className="w-28 shrink-0"><AddToCart packageId={p.id} name={`${group.title}, ${optionLabel(p.featuredDays)}`} compact featured={p.featuredDays > 0} /></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// The filter chips narrow both the tier cards and the detailed table to single-ad or business plans.
export default function PlansExplorer({ groups }) {
  const [filter, setFilter] = useState("all");
  const single = groups.filter(isSingle);
  const business = groups.filter((g) => !isSingle(g));
  const chips = FILTERS.filter((f) => f.id === "all" || (f.id === "single" ? single.length : business.length));
  const shown = filter === "single" ? single : filter === "business" ? business : groups;

  // Best value: the lowest price per ad on the standard listing, among all tiers (not just the filtered ones).
  const perAdOf = (g) => Number(baseOf(g).amount) / baseOf(g).adCount;
  const bestId = groups.length > 1 ? groups.reduce((low, g) => (perAdOf(g) < perAdOf(low) ? g : low), groups[0]).id : null;
  const planCount = shown.reduce((n, g) => n + g.packages.length, 0);

  return (
    <div className="flex flex-col gap-space-2xl">
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <div role="group" aria-label="Filter plans" className="flex flex-wrap gap-2">
          {chips.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`pill transition-colors ${filter === f.id ? "border-neutral-900 bg-neutral-900 text-white" : "hover:bg-canvas"}`}>
              {f.label}
            </button>
          ))}
        </div>
        {/* <p role="status" className="type-label-mono-md text-neutral-700 uppercase">{planCount} plans in {shown.length} {shown.length === 1 ? "tier" : "tiers"}</p> */}
      </div>

      <section aria-labelledby="tiers-title">
        <p className="type-label-mono-md tracking-[0.16em] text-amber-ink uppercase">Pick your size</p>
        <h2 id="tiers-title" className="type-headline-lg mb-space-lg">Select a tier</h2>
        <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-5">
          {shown.map((g) => (
            <TierCard key={g.id} group={g} index={groups.indexOf(g)} highlight={g.id === bestId} />
          ))}
        </div>
      </section>

      <section aria-labelledby="matrix-title">
        <div className="mb-space-lg flex flex-wrap items-end justify-between gap-space-md">
          <div>
            <p className="type-label-mono-md tracking-[0.16em] text-amber-ink uppercase">Every option side by side</p>
            <h2 id="matrix-title" className="type-headline-lg">All {planCount} plans compared</h2>
          </div>
          <p className="type-body-sm max-w-sm text-neutral-700">Prices are in AED and paid once, with no subscription. Each ad credit publishes one approved ad.</p>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-4xl border-collapse">
            <caption className="sr-only">All plans compared</caption>
            <thead>
              <tr>
                {["Plan", "Ads", "Featured", "Live for", "Statistics", "Support", "Price"].map((h, i) => (
                  <th key={h} scope="col" className={`type-label-mono-md px-space-md py-space-sm font-normal uppercase text-neutral-700 ${i === 0 ? "sticky left-0 z-10 bg-white text-left" : i === 6 ? "text-right" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => <MatrixGroup key={g.id} group={g} number={groups.indexOf(g) + 1} />)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
