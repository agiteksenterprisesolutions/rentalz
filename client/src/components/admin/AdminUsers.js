"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { hrefWith } from "@/lib/params";
import { dateOnly, Filters, Table, Td } from "./parts";

const ROLES = ["ADMIN", "MODERATOR", "USER"].map((r) => [r, r[0] + r.slice(1).toLowerCase()]);
const STATUSES = ["ACTIVE", "PENDING", "INACTIVE", "BLOCKED"].map((r) => [r, r[0] + r.slice(1).toLowerCase()]);

export default function AdminUsers({ filters, page }) {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/admin/users", { ...filters, page, limit: 20 });
  return (
    <>
      <PageHeading title="Users" subtitle="Accounts, roles and ad credits." action={can("user:create") && <Link href="/admin/users/new" className="btn btn-primary">New user</Link>} />
      <Filters action="/admin/users" values={filters} fields={[{ name: "q", label: "Search", placeholder: "Name, email or phone" }, { name: "role", label: "Role", options: ROLES }, { name: "status", label: "Status", options: STATUSES }]} />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <Table label="Users" columns={["User", "Role", "Status", "Credits", "Joined"]}>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <Td><Link href={`/admin/users/${u.id}`} className="type-body-md font-medium hover:underline">{u.name}</Link><p className="text-neutral-700">{u.email}{!u.emailVerified && " (unverified)"}</p></Td>
                  <Td>{u.role}</Td>
                  <Td>{u.status}</Td>
                  <Td>{u.adCredits}</Td>
                  <Td className="whitespace-nowrap">{dateOnly(u.createdAt)}</Td>
                </tr>
              ))}
            </Table>
            {data.items.length === 0 && <p className="type-body-md mt-space-md text-neutral-700">No users match these filters.</p>}
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => hrefWith("/admin/users", filters, p)} />
          </>
        )}
      </LoadState>
    </>
  );
}
