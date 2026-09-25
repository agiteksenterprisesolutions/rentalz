import Link from "next/link";
import AuthShowcase from "@/components/auth/AuthShowcase";
import Logo from "@/layout/Logo";

// Two sections: the form on one side and an illustration with a few selling points on the other.
// The illustration is hidden on small screens, where the form gets the whole width. Auth pages skip the site
// header and footer so nothing pulls attention from the form. The forms are compact so they fit one screen (no scrollbar) on a normal laptop.
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between px-space-md md:px-space-xl">
          <Logo />
          <Link href="/ads" className="type-body-sm font-medium underline underline-offset-4">Browse listings</Link>
        </header>
        <main id="content" className="flex flex-1 items-start justify-center px-space-md pb-space-lg pt-space-sm md:px-space-xl lg:items-center">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
      <AuthShowcase />
    </div>
  );
}
