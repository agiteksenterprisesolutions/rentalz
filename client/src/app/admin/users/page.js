import AdminUsers from "@/components/admin/AdminUsers";
import { pageOf, pick } from "@/lib/params";

export const metadata = { title: "Users" };

export default async function Page({ searchParams }) {
  const raw = await searchParams;
  return <AdminUsers filters={pick(raw, ["q", "role", "status"])} page={pageOf(raw)} />;
}
