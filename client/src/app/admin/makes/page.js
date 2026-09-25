import AdminNameList from "@/components/admin/AdminNameList";

export const metadata = { title: "Makes" };

export default function Page() {
  return <AdminNameList endpoint="/catalog/makes" title="Makes" subtitle="Manufacturers offered in ads and search. A make that ads use can't be deleted." noun="make" filterable />;
}
