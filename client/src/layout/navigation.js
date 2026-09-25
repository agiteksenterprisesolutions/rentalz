// One place for the site's links: the header, the mobile menu and the footer all read from here.
// An item with `children` becomes a drop-down (an accordion in the mobile menu).
export const MAIN_NAV = [
  {
    label: "Browse",
    children: [
      { href: "/ads?type=RENT", label: "Rent", text: "Hire machinery and vehicles by the day, week or month" },
      { href: "/ads?type=SELL", label: "Buy", text: "New and used equipment for sale" },
      { href: "/ads", label: "All listings", text: "Everything on TheRentalz in one list" },
    ],
  },
  { href: "/categories", label: "Categories" },
  { href: "/packages", label: "Plans" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
];

export const POST_AD_HREF = "/dashboard/ads/new";
export const SIGN_IN_HREF = "/login";
