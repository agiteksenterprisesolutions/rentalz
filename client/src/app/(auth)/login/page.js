import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import Notice from "@/components/auth/Notice";
import SocialButtons from "@/components/auth/SocialButtons";
import { safeNextPath } from "@/lib/redirect";
import { SOCIAL_ERRORS } from "@/lib/social";

export const metadata = { title: "Sign in | TheRentalz", robots: { index: false } };

export default async function LoginPage({ searchParams }) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  const errorText = SOCIAL_ERRORS[Array.isArray(error) ? error[0] : error];

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage your listings, favourites and orders."
      footer={<>New to TheRentalz? <Link href="/register" className="font-medium underline underline-offset-4">Create an account</Link></>}
    >
      {errorText && <Notice>{errorText}</Notice>}
      <SocialButtons next={nextPath} />
      <LoginForm next={nextPath} />
    </AuthCard>
  );
}
