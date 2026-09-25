import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password | TheRentalz", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={<>Remembered it? <Link href="/login" className="font-medium underline underline-offset-4">Back to sign in</Link></>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
