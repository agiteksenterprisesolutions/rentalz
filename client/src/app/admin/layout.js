import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: { default: "Admin | TheRentalz", template: "%s | Admin" }, robots: { index: false, follow: false } };

// Cookie check only spares signed-out visitors; the shell checks role and permissions with the API and every
// admin request is authorised again on the server.
export default async function AdminLayout({ children }) {
  const store = await cookies();
  if (!store.has("refreshToken") && !store.has("accessToken")) redirect("/login?next=/admin");
  return <AdminShell>{children}</AdminShell>;
}
