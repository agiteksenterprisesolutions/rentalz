"use client";

import { ImageOff, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/api/api";
import Pagination from "@/components/ui/Pagination";
import useFetch, { apiError } from "@/hooks/useFetch";
import { AD_TYPE_LABELS, getAdPrice } from "@/utils/format";
import { EmptyState, LoadState, PageHeading, STATUS_LABELS, StatusPill } from "./parts";

const FILTERS = [["", "All"], ...Object.entries(STATUS_LABELS).filter(([key]) => key !== "DRAFT")];
const dateFmt = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function MyAds({ status = "", page = 1 }) {
  const { data, error, loading, reload } = useFetch("/ads/mine", { status: status || undefined, page, limit: 10 });
  const [confirming, setConfirming] = useState(null);
  const [message, setMessage] = useState(null);

  const remove = async (ad) => {
    try {
      await api.delete(`/ads/${ad.id}`);
      setMessage({ ok: true, text: `“${ad.title}” was deleted.` });
      setConfirming(null);
      reload();
    } catch (e) {
      setMessage({ ok: false, text: apiError(e) });
    }
  };

  const href = (s, p = 1) => `/dashboard/ads?${new URLSearchParams({ ...(s && { status: s }), ...(p > 1 && { page: p }) })}`;

  return (
    <>
      <PageHeading title="My ads" subtitle="Every ad is reviewed before it goes live." action={<Link href="/dashboard/ads/new" className="btn btn-primary">Post an ad</Link>} />

      <nav aria-label="Filter by status" className="mb-space-md flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => (
          <Link key={value} href={href(value)} aria-current={value === status ? "page" : undefined} className={`pill transition-colors ${value === status ? "border-neutral-900 bg-neutral-900 text-white" : "hover:bg-canvas"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {message && <p role={message.ok ? "status" : "alert"} className="pill mb-space-md">{message.text}</p>}

      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && data.items.length === 0 && (
          <EmptyState
            title={status ? "No ads with this status" : "You haven't posted any ads yet"}
            text={status ? undefined : "Post your first ad and reach buyers and renters across the UAE."}
            action={!status && <Link href="/dashboard/ads/new" className="btn btn-primary">Post an ad</Link>}
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <ul className="flex flex-col gap-space-md">
              {data.items.map((ad) => {
                const photo = ad.photos?.[0];
                const { text, unit } = getAdPrice(ad);
                return (
                  <li key={ad.id} className="card flex flex-col gap-space-md p-space-md sm:flex-row">
                    <div className="card-media relative h-40 shrink-0 sm:h-28 sm:w-40">
                      {photo ? <Image src={photo.url} alt="" fill sizes="160px" className="object-cover" /> : <div className="flex size-full items-center justify-center text-neutral-400"><ImageOff aria-hidden="true" /></div>}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-space-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={ad.status} />
                        <span className="pill pill-sm">{AD_TYPE_LABELS[ad.type] ?? ad.type}</span>
                        {ad.isFeatured && <span className="pill pill-available pill-sm">Featured</span>}
                      </div>
                      <h2 className="type-headline-sm truncate">{ad.title}</h2>
                      <p className="type-label-mono-md text-neutral-700">{text}{unit && ` ${unit}`}{ad.expiresAt && ` · ${new Date(ad.expiresAt) < new Date() ? "expired" : "runs until"} ${dateFmt(ad.expiresAt)}`}</p>
                      {ad.status === "REJECTED" && (
                        <p className="type-body-sm text-error">{ad.moderationNote ? `Rejected: ${ad.moderationNote}` : "Rejected."} Edit the ad and it will be reviewed again.</p>
                      )}
                      {ad.status === "PENDING" && <p className="type-body-sm text-neutral-700">Waiting for review. Publishing uses one ad credit once it&apos;s approved.</p>}
                      <div className="mt-auto flex flex-wrap items-center gap-2">
                        <Link href={`/dashboard/ads/${ad.slug}/edit`} className="btn btn-secondary btn-sm"><Pencil aria-hidden="true" />Edit</Link>
                        <Link href={`/ads/${ad.slug}`} className="btn btn-ghost btn-sm">{ad.status === "APPROVED" ? "View" : "Preview"}</Link>
                        {confirming === ad.id ? (
                          <span className="flex items-center gap-2">
                            <span className="type-body-sm">Delete this ad?</span>
                            <button type="button" onClick={() => remove(ad)} className="btn btn-danger btn-sm">Yes, delete</button>
                            <button type="button" onClick={() => setConfirming(null)} className="btn btn-ghost btn-sm">Cancel</button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => setConfirming(ad.id)} className="btn btn-ghost btn-sm"><Trash2 aria-hidden="true" />Delete</button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => href(status, p)} />
          </>
        )}
      </LoadState>
    </>
  );
}
