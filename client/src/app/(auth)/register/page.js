import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";
import SocialButtons from "@/components/auth/SocialButtons";
import { getSocialProviders } from "@/lib/data";

export const metadata = { title: "Create an account | TheRentalz", robots: { index: false } };

export default async function RegisterPage() {
  const providers = await getSocialProviders();
  return (
    <AuthCard
      title="Create your account"
      subtitle="List your equipment or vehicles, save favourites and get in touch with sellers."
      footer={<>Already have an account? <Link href="/login" className="font-medium underline underline-offset-4">Sign in</Link></>}
    >
      <SocialButtons providers={providers} next="/dashboard" verb="Sign up" />
      <RegisterForm />
    </AuthCard>
  );
}
