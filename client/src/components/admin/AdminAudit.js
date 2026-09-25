"use client";

import { LoadState, PageHeading } from "@/components/dashboard/parts";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { hrefWith } from "@/lib/params";
import { dateTime, Filters, Table, Td } from "./parts";

export default function AdminAudit({ filters, page }) {
  const { data, error, loading, reload } = useFetch("/admin/audit-logs", { ...filters, page, limit: 50 });
  return (
    <>
      <PageHeading title="Audit log" subtitle="Moderation, refunds, role and status changes, credit grants and settings." />
      <Filters action="/admin/audit" values={filters} fields={[{ name: "action", label: "Action", placeholder: "e.g. ad:approve" }, { name: "entity", label: "Entity", placeholder: "e.g. Ad" }]} />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <Table label="Audit log" columns={["When", "Who", "Action", "Entity", "Details"]}>
              {data.items.map((l) => (
                <tr key={l.id}>
                  <Td className="whitespace-nowrap">{dateTime(l.createdAt)}</Td>
                  <Td>{l.user?.name ?? "—"}<p className="text-neutral-700">{l.ip}</p></Td>
                  <Td className="font-mono">{l.action}</Td>
                  <Td>{l.entity}<p className="break-all text-neutral-700">{l.entityId}</p></Td>
                  <Td className="break-all font-mono text-neutral-700">{l.meta ? JSON.stringify(l.meta) : ""}</Td>
                </tr>
              ))}
            </Table>
            {data.items.length === 0 && <p className="type-body-md mt-space-md text-neutral-700">Nothing logged yet.</p>}
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => hrefWith("/admin/audit", filters, p)} />
          </>
        )}
      </LoadState>
    </>
  );
}
