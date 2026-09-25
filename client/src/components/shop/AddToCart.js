"use client";

import { Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const noop = () => () => {};

// `compact` is the small version used inside the comparison table cells.
export default function AddToCart({ packageId, name, featured = false, compact = false }) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const { load, loaded, busy, setQuantity } = useCartStore();
  const inCart = useCartStore((s) => s.quantityOf(packageId));
  const cls = `btn w-full ${compact ? "btn-sm" : ""} ${featured ? "btn-primary" : "btn-secondary"}`;

  useEffect(() => {
    if (hydrated && signedIn && !loaded) load();
  }, [hydrated, signedIn, loaded, load]);

  if (!hydrated || !signedIn) {
    return <Link href="/login?next=/packages" className={cls}>{compact ? "Sign in" : "Sign in to buy"}</Link>;
  }
  return (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={busy} onClick={() => setQuantity(packageId, inCart + 1)} aria-label={`Add ${name} to cart`} className={cls}>
        <ShoppingCart aria-hidden="true" />
        {compact ? (inCart ? "Add more" : "Add") : inCart ? "Add another" : "Add to cart"}
      </button>
      {inCart > 0 && compact && <p role="status" className="type-body-sm text-center text-neutral-700">{inCart} in cart</p>}
      {inCart > 0 && !compact && (
        <p role="status" className="type-body-sm flex items-center justify-center gap-2 text-neutral-700">
          <Check aria-hidden="true" className="size-4" />
          {inCart} in your cart · <Link href="/cart" className="font-medium underline underline-offset-4">View cart</Link>
        </p>
      )}
    </div>
  );
}
