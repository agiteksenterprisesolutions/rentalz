import NotFoundActions from "@/components/ui/NotFoundActions";
import StatusPage from "@/components/ui/StatusPage";

export const metadata = { title: "Not found | TheRentalz", robots: { index: false } };

// Raised by notFound() inside the public pages (a missing ad or category); the site header and footer already surround it.
export default function NotFound() {
  return (
    <StatusPage code="404 · Not found" title="That listing or page isn't here" text="It may have expired, been removed by its seller, or the address may be wrong.">
      <NotFoundActions />
    </StatusPage>
  );
}
