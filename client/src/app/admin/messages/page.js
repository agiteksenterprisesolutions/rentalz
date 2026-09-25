import AdminMessages from "@/components/admin/AdminMessages";
import { pageOf, pick } from "@/lib/params";

export const metadata = { title: "Messages" };

export default async function Page({ searchParams }) {
  const raw = await searchParams;
  return <AdminMessages filters={pick(raw, [])} page={pageOf(raw)} />;
}
