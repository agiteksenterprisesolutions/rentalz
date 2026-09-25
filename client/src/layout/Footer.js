import Link from "next/link";
import Logo from "./Logo";
import { POST_AD_HREF } from "./navigation";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/ads?type=RENT", label: "Rent" },
      { href: "/ads?type=SELL", label: "Buy" },
      { href: "/categories", label: "Categories" },
      { href: "/packages", label: "Plans" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { href: POST_AD_HREF, label: "Post an ad" },
      { href: "/dashboard", label: "My dashboard" },
      { href: "/dashboard/favourites", label: "Favourites" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms and conditions" },
      { href: "/privacy-policy", label: "Privacy policy" },
    ],
  },
];

export default function Footer({ cities = [] }) {
  return (
    <footer className="on-dark bg-charcoal text-white/70">
      <div className="container-page grid gap-space-xl py-space-2xl md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex max-w-xs flex-col gap-space-md">
          <Logo size="lg" />
          <p className="type-body-sm">The UAE marketplace for renting and selling equipment and vehicles.</p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
            <h2 className="type-label-mono-md text-white">{column.title}</h2>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href} className="type-body-sm w-fit transition-colors hover:text-amber">
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-white/[0.08]">
        <div className="container-page flex flex-col gap-2 py-space-lg md:flex-row md:items-center md:justify-between">
          <p className="type-label-mono-sm">&copy; {new Date().getFullYear()} TheRentalz. All rights reserved.</p>
          {cities.length > 0 && (
            <p className="type-label-mono-sm text-white/50">{cities.map((city) => city.name).join(" · ")}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
