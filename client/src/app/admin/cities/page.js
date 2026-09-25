import AdminNameList from "@/components/admin/AdminNameList";

export const metadata = { title: "Cities" };

export default function Page() {
  return <AdminNameList endpoint="/catalog/cities" title="Cities" subtitle="Emirates and cities offered in ads and search. Renaming changes the address of its listing pages. A city that ads use can't be deleted." noun="city" showSlug />;
}
