"use client";

import { useState } from "react";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { formatAed } from "@/utils/format";
import { hrefWith } from "@/lib/params";
import { api, dateTime, Filters, Table, Td, useRun } from "./parts";

const STATUSES = [["PENDING", "Awaiting payment"], ["PAID", "Paid"], ["FAILED", "Failed"], ["REFUNDED", "Refunded"]];

export default function AdminOrders({ filters, page }) {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/orders/all", { ...filters, page, limit: 20 });
  const { busy, error: runError, run } = useRun();
  const [refunding, setRefunding] = useState(null);
  const [message, setMessage] = useState(null);

  const refund = async (order, reason) => {
    const { ok, result } = await run(() => api.post(`/orders/${order.id}/refund`, { reason }));
    if (!ok) return;
    const r = result.data.data;
    setMessage(`Refunded. ${r.creditsWithdrawn ?? 0} unused credits withdrawn, ${r.creditsAlreadyUsed ?? 0} already used stay used.`);
    setRefunding(null);
    reload();
  };

  return (
    <>
      <PageHeading title="Orders" subtitle="Package purchases and refunds." />
      <Filters action="/admin/orders" values={filters} fields={[{ name: "status", label: "Status", options: STATUSES }]} />
      {(message || runError) && <p role={runError ? "alert" : "status"} className={`pill mb-space-md ${runError ? "text-error" : ""}`}>{runError ?? message}</p>}
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <Table label="Orders" columns={["Order", "Buyer", "Items", "Total", "Status", ""]}>
              {data.items.map((o) => (
                <tr key={o.id}>
                  <Td className="whitespace-nowrap">#{o.id.slice(0, 8)}<p className="text-neutral-700">{dateTime(o.paidAt ?? o.createdAt)}</p></Td>
                  <Td>{o.user?.name}<p className="text-neutral-700">{o.user?.email}</p></Td>
                  <Td>{o.items.map((i) => <p key={i.id}>{i.quantity} × {i.package?.name}</p>)}</Td>
                  <Td className="whitespace-nowrap">{formatAed(o.total)}</Td>
                  <Td>{o.status}</Td>
                  <Td>{o.status === "PAID" && can("order:refund") && <button type="button" disabled={busy} onClick={() => setRefunding(o)} className="btn btn-secondary btn-sm">Refund</button>}</Td>
                </tr>
              ))}
            </Table>
            {data.items.length === 0 && <p className="type-body-md mt-space-md text-neutral-700">No orders match.</p>}
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => hrefWith("/admin/orders", filters, p)} />
          </>
        )}
      </LoadState>

      {refunding && (
        <div role="dialog" aria-modal="true" aria-labelledby="refund-title" className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-space-md">
          <form className="card flex w-full max-w-md flex-col gap-space-md bg-white p-space-lg" onSubmit={(e) => { e.preventDefault(); refund(refunding, new FormData(e.currentTarget).get("reason").trim() || undefined); }}>
            <h2 id="refund-title" className="type-headline-sm">Refund order #{refunding.id.slice(0, 8)}?</h2>
            <p className="type-body-sm text-neutral-700">The full {formatAed(refunding.total)} goes back to the buyer through Stripe. Unused credits are withdrawn; credits already spent stay spent.</p>
            <div><label htmlFor="reason" className="label">Reason (optional)</label><input id="reason" name="reason" maxLength={200} className="input" /></div>
            <div className="flex gap-2"><button type="submit" disabled={busy} className="btn btn-danger">{busy ? "Refunding…" : "Refund"}</button><button type="button" onClick={() => setRefunding(null)} className="btn btn-ghost">Cancel</button></div>
          </form>
        </div>
      )}
    </>
  );
}
