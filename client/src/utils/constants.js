export const SITE_NAME = "TheRentalz";
export const CURRENCY = "AED";

export const AD_TYPES = [
    { value: "RENT", label: "Rent" },
    { value: "SELL", label: "Sell" },
    { value: "PREMIUM", label: "Premium" },
];

// Mirrors the legacy sort=1..5 modes
export const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "price_desc", label: "Price: high to low" },
    { value: "price_asc", label: "Price: low to high" },
];

export const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/ads?type=RENT", label: "Rent" },
    { href: "/ads?type=SELL", label: "Buy" },
    { href: "/plans", label: "Plans" },
    { href: "/contact", label: "Contact" },
];

// Public contact details (from the legacy site's contact page).
export const CONTACT = { email: "info@therentalz.com", phone: "+971 58 106 9075", phoneHref: "tel:+971581069075", location: "Dubai, United Arab Emirates" };
