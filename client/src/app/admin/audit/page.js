import AdminAudit from "@/components/admin/AdminAudit";
import { pageOf, pick } from "@/lib/params";

export const metadata = { title: "Audit log" };

export default async function Page({ searchParams }) {
  const raw = await searchParams;
  return <AdminAudit filters={pick(raw, ["action", "entity"])} page={pageOf(raw)} />;
}
