import Link from "next/link";
import CartLink from "@/components/shop/CartLink";
import DesktopNav from "./DesktopNav";
import HeaderAccount from "./HeaderAccount";
import Logo from "./Logo";
import MobileNav from "./MobileNav";
import { POST_AD_HREF } from "./navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-canvas/85 backdrop-blur-frost">
      <a href="#content" className="sr-only-focusable btn btn-primary absolute left-space-md top-space-sm z-50">
        Skip to content
      </a>
      <div className="container-page relative flex h-16 items-center gap-4 md:h-[4.5rem] lg:gap-8">
        <Logo />
        <DesktopNav />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <CartLink />
          <Link href={POST_AD_HREF} className="btn btn-secondary btn-sm mx-1 hidden sm:inline-flex">
            Post an ad
          </Link>
          <HeaderAccount />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
