import AuthCard from "@/components/auth/AuthCard";
import SocialComplete from "@/components/auth/SocialComplete";

export const metadata = { title: "Signing you in | TheRentalz", robots: { index: false } };

export default async function Page({ searchParams }) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Almost there">
      <SocialComplete next={Array.isArray(next) ? next[0] : next} />
    </AuthCard>
  );
}
