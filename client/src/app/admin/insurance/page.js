import AdminInsurance from "@/components/admin/AdminInsurance";
import { pageOf, pick } from "@/lib/params";

export const metadata = { title: "Insurance leads" };

export default async function Page({ searchParams }) {
  const raw = await searchParams;
  return <AdminInsurance filters={pick(raw, ["q"])} page={pageOf(raw)} />;
}
