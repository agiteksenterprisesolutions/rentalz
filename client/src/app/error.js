"use client";

import ErrorView from "@/components/ui/ErrorView";
import Footer from "@/layout/Footer";
import Header from "@/layout/Header";

// Failures outside the public pages (sign-in, admin) and in the (main) layout itself. The root layout survives,
// but the (main) layout does not, so this brings its own header and footer.
export default function Error({ error, retry }) {
  return (
    <>
      <Header />
      <main id="content" className="flex-1">
        <ErrorView error={error} retry={retry} />
      </main>
      <Footer />
    </>
  );
}
