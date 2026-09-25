import Footer from "@/layout/Footer";
import Header from "@/layout/Header";
import { getCities } from "@/lib/data";

// Shell for every public page: header, content, footer
export default async function MainLayout({ children }) {
  const cities = await getCities();
  return (
    <>
      <Header />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer cities={cities} />
    </>
  );
}
