import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = { title: { default: "My account | TheRentalz", template: "%s | TheRentalz" }, robots: { index: false, follow: false } };

// The API decides who is really signed in. This check only spares signed-out visitors a page of failed requests:
// no session cookie at all means go to the sign-in page.
export default async function DashboardLayout({ children }) {
  const store = await cookies();
  if (!store.has("refreshToken") && !store.has("accessToken")) redirect("/login?next=/dashboard");
  return <DashboardShell>{children}</DashboardShell>;
}
