"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LoadState, PageHeading, StatusPill } from "@/components/dashboard/parts";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { AD_TYPE_LABELS, getAdPrice } from "@/utils/format";
import { hrefWith } from "@/lib/params";
import { api, Filters, Table, Td, useRun } from "./parts";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "EXPIRED", "SOLD", "DRAFT"].map((s) => [s, s[0] + s.slice(1).toLowerCase()]);

export default function AdminAds({ filters, page }) {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/ads/manage", { ...filters, page, limit: 20 });
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState(null);
  const { busy, error: runError, run } = useRun();
  const [rejecting, setRejecting] = useState(null); // array of ids waiting for a reason

  const items = data?.items ?? [];
  const toggle = (id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const allSelected = items.length > 0 && items.every((a) => selected.has(a.id));

  const act = async (ids, action, extra = {}) => {
    const { ok, result } = await run(() => api.post("/admin/ads/bulk", { ids, action, ...extra }));
    if (!ok) return;
    const results = result.data.data ?? [];
    const failed = results.filter((r) => r.ok === false);
    setMessage(failed.length ? `${results.length - failed.length} done, ${failed.length} failed: ${failed[0].error}` : `Done for ${ids.length} ${ids.length === 1 ? "ad" : "ads"}.`);
    setSelected(new Set());
    setRejecting(null);
    reload();
  };

  const ids = [...selected];
  return (
    <>
      <PageHeading title="Ads" subtitle="Review, feature and remove listings." />
      <Filters action="/admin/ads" values={filters} fields={[{ name: "q", label: "Search", placeholder: "Title or keyword" }, { name: "status", label: "Status", options: STATUSES }]} />
      {(message || runError) && <p role={runError ? "alert" : "status"} className={`pill mb-space-md ${runError ? "text-error" : ""}`}>{runError ?? message}</p>}

      {ids.length > 0 && (
        <div className="card mb-space-md flex flex-wrap items-center gap-2 p-space-sm" role="group" aria-label="Actions for selected ads">
          <span className="type-body-sm px-2">{ids.length} selected</span>
          {can("ad:approve") && <button type="button" disabled={busy} onClick={() => act(ids, "approve")} className="btn btn-primary btn-sm">Approve</button>}
          {can("ad:approve") && <button type="button" disabled={busy} onClick={() => setRejecting(ids)} className="btn btn-secondary btn-sm">Reject…</button>}
          {can("ad:feature") && <button type="button" disabled={busy} onClick={() => act(ids, "feature")} className="btn btn-secondary btn-sm">Feature</button>}
          {can("ad:feature") && <button type="button" disabled={busy} onClick={() => act(ids, "unfeature")} className="btn btn-ghost btn-sm">Unfeature</button>}
          {can("ad:delete") && <button type="button" disabled={busy} onClick={() => window.confirm(`Delete ${ids.length} ads?`) && act(ids, "delete")} className="btn btn-danger btn-sm">Delete</button>}
        </div>
      )}

      {rejecting && (
        <form className="card mb-space-md flex flex-col gap-space-sm p-space-md" onSubmit={(e) => { e.preventDefault(); act(rejecting, "reject", { reason: new FormData(e.currentTarget).get("reason").trim() }); }}>
          <label htmlFor="reason" className="label">Reason (emailed to the seller)</label>
          <textarea id="reason" name="reason" required minLength={3} rows={3} className="textarea" />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-danger btn-sm">Reject {rejecting.length === 1 ? "ad" : `${rejecting.length} ads`}</button>
            <button type="button" onClick={() => setRejecting(null)} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <Table label="Ads" columns={["", "Ad", "Seller", "Status", "Price", ""]}>
              {items.map((ad) => (
                <tr key={ad.id}>
                  <Td><input type="checkbox" className="checkbox" checked={selected.has(ad.id)} onChange={() => toggle(ad.id)} aria-label={`Select ${ad.title}`} /></Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="card-media relative size-12 shrink-0">{ad.photos?.[0] && <Image src={ad.photos[0].url} alt="" fill sizes="48px" className="object-cover" />}</div>
                      <div className="min-w-0">
                        <Link href={`/ads/${ad.slug}`} className="type-body-md font-medium hover:underline">{ad.title}</Link>
                        <p className="text-neutral-700">{AD_TYPE_LABELS[ad.type]} · {ad.city?.name}{ad.isFeatured && " · Featured"}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Link href={`/admin/users/${ad.user?.id}`} className="hover:underline">{ad.user?.name}</Link><p className="text-neutral-700">{ad.user?.email}</p></Td>
                  <Td><StatusPill status={ad.status} /></Td>
                  <Td className="whitespace-nowrap">{getAdPrice(ad).text}</Td>
                  <Td>
                    <div className="flex gap-1">
                      {ad.status !== "APPROVED" && can("ad:approve") && <button type="button" disabled={busy} onClick={() => act([ad.id], "approve")} className="btn btn-secondary btn-sm">Approve</button>}
                      {ad.status !== "REJECTED" && can("ad:approve") && <button type="button" disabled={busy} onClick={() => setRejecting([ad.id])} className="btn btn-ghost btn-sm">Reject</button>}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            {items.length === 0 && <p className="type-body-md mt-space-md text-neutral-700">No ads match these filters.</p>}
            {items.length > 0 && (
              <label className="check-row mt-space-sm"><input type="checkbox" className="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((a) => a.id)))} /><span className="type-body-sm">Select all on this page</span></label>
            )}
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => hrefWith("/admin/ads", filters, p)} />
          </>
        )}
      </LoadState>
    </>
  );
}
