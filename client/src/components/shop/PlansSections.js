import { CalendarClock, CreditCard, Megaphone, ShieldCheck, Sparkles, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { CONTACT } from "@/utils/constants";
import { formatAed } from "@/utils/format";

export function PlansHero({ summary }) {
  const facts = [
    { icon: CalendarClock, text: summary.duration ? `Each ad live for ${summary.duration}` : "Choose how long ads run" },
    { icon: CreditCard, text: "One-time payment, no subscription" },
    { icon: ShieldCheck, text: "Every ad reviewed before it goes live" },
    { icon: Sparkles, text: "Featured placement available" },
  ];
  return (
    <div>
      <header className="grid gap-space-lg lg:grid-cols-[1fr_22rem] lg:items-center">
        <div>
          <p className="type-label-mono-md tracking-[0.16em] text-amber-ink uppercase">Plans and pricing</p>
          <h1 className="type-display-xl mt-space-sm uppercase">Simple pricing for every listing</h1>
          <p className="type-body-lg mt-space-md max-w-2xl text-neutral-700">
            Buy ad credits once and publish when you&apos;re ready. Start with a single ad, or save on every ad with a business tier. Add featured days if you want your listing shown first.
          </p>
        </div>
        <aside className="scheme-light rounded-card-lg bg-amber p-space-lg" aria-label="Pricing at a glance">
          <p className="type-label-mono-md tracking-[0.16em] text-neutral-900/70 uppercase">Plans start at</p>
          <p className="type-display-xl">{formatAed(summary.minPrice)}</p>
          <p className="type-body-md mt-1 text-neutral-900/80">for a single ad, live for {summary.duration ?? "the period shown"}.</p>
          <dl className="mt-space-md grid grid-cols-2 gap-space-md border-t border-neutral-900/15 pt-space-md">
            <div><dt className="type-label-mono-md text-neutral-900/70 uppercase">Plans</dt><dd className="type-headline-md">{summary.plans}</dd></div>
            <div><dt className="type-label-mono-md text-neutral-900/70 uppercase">Up to</dt><dd className="type-headline-md">{summary.maxAds} ads</dd></div>
          </dl>
        </aside>
      </header>
      <ul className="mt-space-xl grid gap-space-sm sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(({ icon: Icon, text }) => (
          <li key={text} className="card flex items-center gap-3 p-space-md">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-amber-deep" />
            <span className="type-body-sm font-medium">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeaturedBoost({ summary }) {
  const range = summary.maxFeaturedDays > 0 ? `${summary.minFeaturedDays} to ${summary.maxFeaturedDays} days` : null;
  return (
    <section aria-labelledby="boost-title">
      <p className="type-label-mono-md tracking-[0.16em] text-amber-ink uppercase">Featured placement</p>
      <h2 id="boost-title" className="type-headline-lg mb-space-lg">What featured days do for your ad</h2>
      <div className="grid gap-space-md md:grid-cols-3">
        <article className="card flex flex-col gap-space-sm p-space-lg">
          <Megaphone aria-hidden="true" className="size-7 text-amber-deep" />
          <h3 className="type-headline-sm">Home page spotlight</h3>
          <p className="type-body-md text-neutral-700">Featured ads appear in the Featured listings section on our home page, where every visitor lands.</p>
        </article>
        <article className="card flex flex-col gap-space-sm p-space-lg">
          <Star aria-hidden="true" className="size-7 text-amber-deep" />
          <h3 className="type-headline-sm">Featured badge and first place</h3>
          <p className="type-body-md text-neutral-700">Your listing carries a Featured badge, and it comes first when buyers sort search results by featured.</p>
        </article>
        <article className="card-dark flex flex-col gap-space-sm p-space-lg">
          <TrendingUp aria-hidden="true" className="size-7 text-amber" />
          <h3 className="type-headline-sm">{range ? `Choose ${range}` : "Choose your boost"}</h3>
          <p className="type-body-md text-white/70">Featured days start when your ad is approved. Pick a short boost to test the market, or a longer one for a busy season.</p>
        </article>
      </div>
    </section>
  );
}

export function PlansCta() {
  return (
    <section aria-labelledby="cta-title" className="on-dark rounded-card-lg bg-charcoal p-space-lg text-white md:p-space-2xl">
      <div className="flex flex-col items-start justify-between gap-space-lg lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="type-label-mono-md tracking-[0.16em] text-amber uppercase">Need something different?</p>
          <h2 id="cta-title" className="type-headline-lg mt-space-sm">Can&apos;t find the plan you need?</h2>
          <p className="type-body-lg mt-space-sm text-white/70">Tell us how many ads you want to publish, how long they should run and whether you want featured days. We&apos;ll suggest the best plan for you.</p>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          <Link href="/contact" className="btn btn-primary btn-lg">Contact us</Link>
          <a href={`mailto:${CONTACT.email}`} className="btn btn-ghost-inverse btn-lg">{CONTACT.email}</a>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ["How does payment work?", "You pay once for a plan, on Stripe's secure payment page. There's no subscription and nothing renews on its own. We never see your card details."],
  ["When is an ad credit used?", "A credit is used when we approve one of your ads, not when you buy the plan. Ads that are rejected don't use a credit."],
  ["How long does an ad stay live?", "Each plan shows how long its ads run, counted from approval. When an ad expires you can renew it with another credit."],
  ["What are featured days?", "Featured days are the number of days each ad is highlighted, starting when it's approved. After that the ad carries on as a normal listing until it expires."],
  ["Can I buy more later?", "Yes. New credits are added to your balance, and the oldest are used first, so nothing is lost."],
  ["What happens if I need a refund?", "Contact us and we'll look at your order. Credits you haven't used can be withdrawn; credits already used on published ads stay used."],
];

export function PlansFaq() {
  return (
    <section aria-labelledby="faq-title" className="grid gap-space-lg lg:grid-cols-[1fr_2fr]">
      <div>
        <p className="type-label-mono-md tracking-[0.16em] text-amber-ink uppercase">Good to know</p>
        <h2 id="faq-title" className="type-headline-lg">Frequently asked questions</h2>
        <p className="type-body-md mt-space-sm text-neutral-700">Something we didn&apos;t cover? <Link href="/contact" className="font-medium underline underline-offset-4">Ask us</Link>.</p>
      </div>
      <div className="flex flex-col gap-space-sm">
        {FAQS.map(([question, answer]) => (
          <details key={question} className="card group p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-space-md font-display text-base font-semibold">
              {question}
              <span aria-hidden="true" className="text-xl leading-none text-neutral-700 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="type-body-md px-space-md pb-space-md text-neutral-700">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
