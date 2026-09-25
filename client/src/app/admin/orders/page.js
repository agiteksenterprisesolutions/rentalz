import AdminOrders from "@/components/admin/AdminOrders";
import { pageOf, pick } from "@/lib/params";

export const metadata = { title: "Orders" };

export default async function Page({ searchParams }) {
  const raw = await searchParams;
  return <AdminOrders filters={pick(raw, ["status"])} page={pageOf(raw)} />;
}
