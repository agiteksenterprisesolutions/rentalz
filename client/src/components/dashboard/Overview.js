"use client";

import { Eye, Heart, MessageCircle, Phone, Ticket } from "lucide-react";
import Link from "next/link";
import useFetch from "@/hooks/useFetch";
import { LoadState, PageHeading, STATUS_LABELS } from "./parts";

const fmt = (n) => Number(n ?? 0).toLocaleString("en-US");

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-space-md">
      <p className="type-label-mono-md flex items-center gap-2 text-neutral-700 uppercase"><Icon aria-hidden="true" className="size-4" />{label}</p>
      <p className="type-headline-lg mt-space-sm">{fmt(value)}</p>
      {hint && <p className="type-body-sm text-neutral-700">{hint}</p>}
    </div>
  );
}

export default function Overview() {
  const { data, error, loading, reload } = useFetch("/users/me/dashboard");

  return (
    <>
      <PageHeading title="Overview" subtitle="How your listings are doing." action={<Link href="/dashboard/ads/new" className="btn btn-primary">Post an ad</Link>} />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && <OverviewBody data={data} />}
      </LoadState>
    </>
  );
}

function OverviewBody({ data }) {
  const { ads, credits, audience, topAds } = data;
  const days = audience.viewsPerDay ?? [];
  const max = Math.max(1, ...days.map((d) => d.views));

  return (
    <div className="flex flex-col gap-space-lg">
      {ads.expiringWithin7Days > 0 && (
        <p role="status" className="pill">{ads.expiringWithin7Days} {ads.expiringWithin7Days === 1 ? "ad expires" : "ads expire"} within 7 days.</p>
      )}

      <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Eye} label="Views, 30 days" value={audience.last30Days.VIEW} hint={`${fmt(audience.allTime.VIEW)} all time`} />
        <Stat icon={Phone} label="Calls, 30 days" value={audience.last30Days.PHONE_CLICK} hint={`${fmt(audience.allTime.PHONE_CLICK)} all time`} />
        <Stat icon={MessageCircle} label="WhatsApp, 30 days" value={audience.last30Days.WHATSAPP_CLICK} hint={`${fmt(audience.allTime.WHATSAPP_CLICK)} all time`} />
        <Stat icon={Heart} label="Favourited" value={audience.favourites} hint="saves across your ads" />
      </div>

      <div className="grid gap-space-md lg:grid-cols-2">
        <section aria-labelledby="ad-status" className="card p-space-md">
          <h2 id="ad-status" className="type-headline-sm mb-space-md">Your ads ({ads.total})</h2>
          <ul className="flex flex-col gap-space-sm">
            {Object.keys(STATUS_LABELS).filter((s) => s !== "DRAFT").map((status) => (
              <li key={status} className="flex justify-between">
                <Link href={`/dashboard/ads?status=${status}`} className="type-body-md hover:underline">{STATUS_LABELS[status]}</Link>
                <span className="type-label-mono-md">{ads[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credits" className="card p-space-md">
          <h2 id="credits" className="type-headline-sm mb-space-sm flex items-center gap-2"><Ticket aria-hidden="true" className="size-5" />Ad credits</h2>
          <p className="type-headline-lg">{fmt(credits.available)}</p>
          <p className="type-body-sm mb-space-md text-neutral-700">One credit publishes one ad once it&apos;s approved.</p>
          {credits.lots?.length > 0 && (
            <ul className="mb-space-md flex flex-col gap-1 border-t border-neutral-200 pt-space-sm">
              {credits.lots.map((lot) => (
                <li key={`${lot.createdAt}-${lot.remaining}-${lot.durationDays}`} className="type-body-sm flex justify-between text-neutral-700">
                  <span>{lot.remaining} left · {lot.durationDays} days{lot.featuredDays ? ` · ${lot.featuredDays} featured` : ""}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/packages" className="btn btn-secondary btn-sm">Buy credits</Link>
        </section>
      </div>

      {days.length > 0 && (
        <section aria-labelledby="views-chart" className="card p-space-md">
          <h2 id="views-chart" className="type-headline-sm mb-space-md">Views, last 14 days</h2>
          <div className="flex h-32 items-end gap-1" role="img" aria-label={`Views per day: ${days.map((d) => d.views).join(", ")}`}>
            {days.map((d) => {
              const value = d.views;
              return <div key={d.day} title={`${d.day}: ${value}`} className="flex-1 rounded-t bg-amber" style={{ height: `${Math.max(4, (value / max) * 100)}%` }} />;
            })}
          </div>
        </section>
      )}

      {topAds?.length > 0 && (
        <section aria-labelledby="top-ads" className="card p-space-md">
          <h2 id="top-ads" className="type-headline-sm mb-space-md">Most viewed ads</h2>
          <ol className="flex flex-col gap-space-sm">
            {topAds.map((ad) => (
              <li key={ad.id} className="flex justify-between gap-3">
                <Link href={`/ads/${ad.slug}`} className="type-body-md truncate hover:underline">{ad.title}</Link>
                <span className="type-label-mono-md shrink-0">{fmt(ad.views)} views</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
