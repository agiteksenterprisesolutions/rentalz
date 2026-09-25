"use client";

import { LoadState, PageHeading } from "@/components/dashboard/parts";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { hrefWith } from "@/lib/params";
import { dateOnly, Filters, Table, Td } from "./parts";

export default function AdminInsurance({ filters, page }) {
  const { data, error, loading, reload } = useFetch("/admin/insurance-leads", { ...filters, page, limit: 25 });
  return (
    <>
      <PageHeading title="Insurance leads" subtitle="Requests from the legacy insurance form (personal data: handle with care)." />
      <Filters action="/admin/insurance" values={filters} fields={[{ name: "q", label: "Search", placeholder: "Name, email, make…" }]} />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <p className="type-body-sm mb-space-sm text-neutral-700">{data.pagination.total.toLocaleString("en-US")} leads</p>
            <Table label="Insurance leads" columns={["Name", "Contact", "Vehicle", "Cover", "Received"]}>
              {data.items.map((l) => (
                <tr key={l.id}>
                  <Td>{l.firstName} {l.lastName}<p className="text-neutral-700">{l.nationality}</p></Td>
                  <Td>{l.email}<p className="text-neutral-700">{l.mobile}</p></Td>
                  <Td>{[l.make, l.model, l.yearManufacturing].filter(Boolean).join(" ")}<p className="text-neutral-700">{l.city}</p></Td>
                  <Td>{l.insuranceType}<p className="text-neutral-700">{l.claimHistory}</p></Td>
                  <Td className="whitespace-nowrap">{dateOnly(l.createdAt)}</Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.pagination.page} totalPages={Math.min(data.pagination.totalPages, 500)} buildHref={(p) => hrefWith("/admin/insurance", filters, p)} />
          </>
        )}
      </LoadState>
    </>
  );
}
