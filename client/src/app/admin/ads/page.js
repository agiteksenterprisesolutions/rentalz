import AdminAds from "@/components/admin/AdminAds";
import { pageOf, pick } from "@/lib/params";

export const metadata = { title: "Ads" };

export default async function Page({ searchParams }) {
  const raw = await searchParams;
  return <AdminAds filters={pick(raw, ["q", "status"])} page={pageOf(raw)} />;
}
