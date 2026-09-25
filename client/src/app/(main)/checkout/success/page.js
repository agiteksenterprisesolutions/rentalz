import RequireSession from "@/components/auth/RequireSession";
import CheckoutResult from "@/components/shop/CheckoutResult";

export const metadata = { title: "Payment | TheRentalz", robots: { index: false }, referrer: "no-referrer" };

export default async function CheckoutSuccessPage({ searchParams }) {
  const { order } = await searchParams;
  return (
    <RequireSession>
      <div className="container-page py-space-xl">
        <CheckoutResult orderId={Array.isArray(order) ? order[0] : order} />
      </div>
    </RequireSession>
  );
}
