import AuthCard from "@/components/auth/AuthCard";
import ConfirmEmailChange from "@/components/auth/ConfirmEmailChange";

export const metadata = { title: "Confirm new email | TheRentalz", robots: { index: false }, referrer: "no-referrer" };

export default async function Page({ searchParams }) {
  const { token } = await searchParams;
  return (
    <AuthCard title="Confirm your new email">
      <ConfirmEmailChange token={Array.isArray(token) ? token[0] : token} />
    </AuthCard>
  );
}
