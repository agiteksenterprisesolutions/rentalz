import NotFoundActions from "@/components/ui/NotFoundActions";
import StatusPage from "@/components/ui/StatusPage";
import Footer from "@/layout/Footer";
import Header from "@/layout/Header";
import { getCities } from "@/lib/data";

export const metadata = { title: "Page not found | TheRentalz", robots: { index: false } };

// Any address that matches no page. It sits outside the (main) layout, so it brings its own header and footer.
export default async function NotFound() {
  const cities = await getCities();
  return (
    <>
      <Header />
      <main id="content" className="flex-1">
        <StatusPage code="404 · Page not found" title="We can't find that page" text="The link may be broken or the page may have moved. Try the listings, or head back to the home page.">
          <NotFoundActions />
        </StatusPage>
      </main>
      <Footer cities={cities} />
    </>
  );
}
