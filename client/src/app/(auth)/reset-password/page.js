import AuthCard from "@/components/auth/AuthCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Choose a new password | TheRentalz", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }) {
  const { token } = await searchParams;
  return (
    <AuthCard title="Choose a new password" subtitle="Pick something you don't use anywhere else.">
      <ResetPasswordForm token={Array.isArray(token) ? token[0] : token} />
    </AuthCard>
  );
}
