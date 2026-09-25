import { JetBrains_Mono, Space_Grotesk, Work_Sans } from "next/font/google";
import "./globals.css";

// Font roles from the design system: headlines, body copy, and specs/prices/badges.
// The CSS variables feed --font-display / --font-body / --font-mono in styles/tokens.css.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "TheRentalz",
    template: "%s | TheRentalz",
  },
  description: "The UAE marketplace for renting and selling equipment and vehicles.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#12110d" },
  ],
};

// Runs before the first paint so the saved (or system) theme is applied without a flash of the wrong one.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the script above sets data-theme on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${workSans.variable} ${jetBrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
