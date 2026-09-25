"use client";

import Link from "next/link";
import useFetch from "@/hooks/useFetch";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import { useAuthStore } from "@/store/authStore";
import { formatAed } from "@/utils/format";

const n = (v) => Number(v ?? 0).toLocaleString("en-US");

function Stat({ label, value, hint, href }) {
  const body = (
    <>
      <p className="type-label-mono-md text-neutral-700 uppercase">{label}</p>
      <p className="type-headline-lg mt-space-sm">{value}</p>
      {hint && <p className="type-body-sm text-neutral-700">{hint}</p>}
    </>
  );
  return href ? <Link href={href} className="card card-interactive p-space-md">{body}</Link> : <div className="card p-space-md">{body}</div>;
}

export default function AdminOverview() {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/admin/stats");
  const canSales = can("report:sales");
  const sales = useFetch(canSales ? "/admin/reports/sales" : "/admin/stats");
  const days = canSales ? (sales.data?.days ?? []) : [];
  const max = Math.max(1, ...days.map((d) => Number(d.revenue ?? 0)));

  return (
    <>
      <PageHeading title="Overview" subtitle="What needs attention on the marketplace." />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="flex flex-col gap-space-lg">
            <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-4">
              {data.ads && <Stat label="Ads waiting for review" value={n(data.ads.PENDING)} hint={`${n(data.ads.APPROVED)} live · ${n(data.ads.total)} total`} href="/admin/ads?status=PENDING" />}
              {data.users && <Stat label="Users" value={n(data.users.total)} hint={`${n(data.users.PENDING)} unverified · ${n(data.users.BLOCKED)} blocked`} href="/admin/users" />}
              {data.viewsLast30Days !== undefined && <Stat label="Ad views, 30 days" value={n(data.viewsLast30Days)} />}
              {data.contactsUnread !== undefined && <Stat label="Unread messages" value={n(data.contactsUnread)} href="/admin/messages" />}
              {data.sales && (
                <>
                  <Stat label="Revenue, 30 days" value={formatAed(data.sales.revenueLast30Days)} hint={`${n(data.sales.paidOrdersLast30Days)} paid orders`} />
                  <Stat label="Revenue, all time" value={formatAed(data.sales.revenue)} hint={`${n(data.sales.paidOrders)} paid orders`} />
                  <Stat label="Refunded" value={formatAed(data.sales.refundedAmount)} hint={`${n(data.sales.refundedOrders)} orders`} />
                  <Stat label="Awaiting payment" value={n(data.sales.pendingOrders)} href="/admin/orders?status=PENDING" />
                </>
              )}
            </div>
            {canSales && (
              <section aria-labelledby="rev" className="card p-space-md">
                <h2 id="rev" className="type-headline-sm mb-space-md">Paid revenue, last 30 days</h2>
                {days.length === 0 ? (
                  <p className="type-body-sm text-neutral-700">No paid orders in this period.</p>
                ) : (
                  <div className="flex h-32 items-end gap-1" role="img" aria-label={`Total ${formatAed(sales.data.totalRevenue)}`}>
                    {days.map((d) => <div key={d.day} title={`${d.day}: ${formatAed(d.revenue)}`} className="flex-1 rounded-t bg-amber" style={{ height: `${Math.max(4, (Number(d.revenue) / max) * 100)}%` }} />)}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </LoadState>
    </>
  );
}
