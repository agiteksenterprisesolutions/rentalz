"use client";

import { LoadState, PageHeading } from "@/components/dashboard/parts";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { hrefWith } from "@/lib/params";
import { api, dateTime, useRun } from "./parts";

export default function AdminMessages({ filters, page }) {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/admin/contacts", { ...filters, page, limit: 20 });
  const { busy, error: runError, run } = useRun();
  const act = async (fn) => { const { ok } = await run(fn); if (ok) reload(); };

  return (
    <>
      <PageHeading title="Messages" subtitle="From the contact form." />
      {runError && <p role="alert" className="pill mb-space-md text-error">{runError}</p>}
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <ul className="flex flex-col gap-space-sm">
              {data.items.map((m) => (
                <li key={m.id} className={`card flex flex-col gap-space-sm p-space-md ${m.isRead ? "" : "border-amber"}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="type-body-md font-medium">{m.name} <a href={`mailto:${m.email}`} className="font-normal text-neutral-700 underline underline-offset-4">{m.email}</a></p>
                    <p className="type-label-mono-md text-neutral-700">{dateTime(m.createdAt)}{!m.isRead && " · NEW"}</p>
                  </div>
                  <p className="type-body-md whitespace-pre-line break-words">{m.message}</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => act(() => api.patch(`/admin/contacts/${m.id}/read`, { isRead: !m.isRead }))} className="btn btn-secondary btn-sm">{m.isRead ? "Mark unread" : "Mark read"}</button>
                    {can("contact:delete") && <button type="button" disabled={busy} onClick={() => window.confirm("Delete this message?") && act(() => api.delete(`/admin/contacts/${m.id}`))} className="btn btn-ghost btn-sm">Delete</button>}
                  </div>
                </li>
              ))}
            </ul>
            {data.items.length === 0 && <p className="type-body-md text-neutral-700">No messages.</p>}
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => hrefWith("/admin/messages", filters, p)} />
          </>
        )}
      </LoadState>
    </>
  );
}
