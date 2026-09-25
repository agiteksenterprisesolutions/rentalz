import AdminUserDetail from "@/components/admin/AdminUserDetail";

export const metadata = { title: "User" };

export default async function Page({ params }) {
  const { id } = await params;
  return <AdminUserDetail id={id} />;
}
