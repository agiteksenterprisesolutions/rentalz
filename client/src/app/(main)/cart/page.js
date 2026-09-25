import RequireSession from "@/components/auth/RequireSession";
import CartView from "@/components/shop/CartView";

export const metadata = { title: "Your cart | TheRentalz", robots: { index: false } };

export default function CartPage() {
  return (
    <RequireSession>
      <div className="container-page py-space-xl">
        <h1 className="type-headline-lg mb-space-lg">Your cart</h1>
        <CartView />
      </div>
    </RequireSession>
  );
}
