"use client";

import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { formatAed } from "@/utils/format";
import { EmptyState, LoadState, PageHeading } from "./parts";

const STATUS = { PENDING: "Awaiting payment", PAID: "Paid", FAILED: "Failed", REFUNDED: "Refunded" };
const dateFmt = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function Orders({ page = 1 }) {
  const { data, error, loading, reload } = useFetch("/orders", { page, limit: 10 });
  const items = Array.isArray(data) ? data : (data?.items ?? []);

  return (
    <>
      <PageHeading title="Orders" subtitle="Your package purchases." />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && items.length === 0 && <EmptyState title="No orders yet" text="Buy an ad package to publish more listings." action={<Link href="/packages" className="btn btn-primary">See packages</Link>} />}
        {items.length > 0 && (
          <>
            <ul className="flex flex-col gap-space-md">
              {items.map((order) => (
                <li key={order.id} className="card p-space-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="type-label-mono-md text-neutral-700">{dateFmt(order.paidAt ?? order.createdAt)} · #{order.id.slice(0, 8)}</p>
                    <span className={`pill pill-sm ${order.status === "PAID" ? "pill-available" : ""}`}>{STATUS[order.status] ?? order.status}</span>
                  </div>
                  <ul className="my-space-sm flex flex-col gap-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="type-body-md flex justify-between gap-3">
                        <span>{item.quantity} × {item.package?.name} <span className="text-neutral-700">({item.adCredits * item.quantity} {item.adCredits * item.quantity === 1 ? "ad" : "ads"})</span></span>
                        <span>{formatAed(item.unitPrice * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="type-headline-sm border-t border-neutral-200 pt-space-sm text-right">Total {formatAed(order.total)}</p>
                </li>
              ))}
            </ul>
            {data.pagination && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => `/dashboard/orders?page=${p}`} />}
          </>
        )}
      </LoadState>
    </>
  );
}
