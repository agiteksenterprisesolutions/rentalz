import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";
import SocialButtons from "@/components/auth/SocialButtons";

export const metadata = { title: "Create an account | TheRentalz", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="List your equipment or vehicles, save favourites and get in touch with sellers."
      footer={<>Already have an account? <Link href="/login" className="font-medium underline underline-offset-4">Sign in</Link></>}
    >
      <SocialButtons next="/dashboard" verb="Sign up" />
      <RegisterForm />
    </AuthCard>
  );
}
