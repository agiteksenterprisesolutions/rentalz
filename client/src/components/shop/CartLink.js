"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const noop = () => () => {};

// Header cart icon. Only shown to signed-in users, with the number of items in the cart.
export default function CartLink() {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const load = useCartStore((s) => s.load);
  const loaded = useCartStore((s) => s.loaded);
  const count = useCartStore((s) => s.cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0);

  useEffect(() => {
    if (hydrated && signedIn && !loaded) load();
  }, [hydrated, signedIn, loaded, load]);

  if (!hydrated || !signedIn) return null;
  return (
    <Link href="/cart" aria-label={count ? `Cart, ${count} items` : "Cart"} className="btn btn-ghost btn-icon btn-sm relative">
      <ShoppingCart aria-hidden="true" />
      {count > 0 && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-amber px-1 font-mono text-[11px] font-bold leading-5 text-on-amber">{count}</span>}
    </Link>
  );
}
