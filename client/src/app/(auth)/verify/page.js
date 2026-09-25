import AuthCard from "@/components/auth/AuthCard";
import VerifyEmail from "@/components/auth/VerifyEmail";

export const metadata = { title: "Verify your email | TheRentalz", robots: { index: false }, referrer: "no-referrer" };

export default async function VerifyPage({ searchParams }) {
  const { token } = await searchParams;
  return (
    <AuthCard title="Email verification">
      <VerifyEmail token={Array.isArray(token) ? token[0] : token} />
    </AuthCard>
  );
}
