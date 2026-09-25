"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/api/api";
import Notice from "@/components/auth/Notice";
import { apiError } from "@/hooks/useFetch";
import { useCartStore } from "@/store/cartStore";
import { formatAed } from "@/utils/format";

const duration = (p) => `${p.durationValue} ${p.durationUnit === "MONTH" ? "month" : "day"}${p.durationValue === 1 ? "" : "s"}`;

export default function CartView() {
  const { cart, loaded, busy, error, load, setQuantity, empty } = useCartStore();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    load();
  }, [load]);

  const checkout = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const { data } = await api.post("/payments/checkout");
      window.location.assign(data.data.url); // Stripe's hosted payment page
    } catch (e) {
      setPayError(apiError(e));
      setPaying(false);
    }
  };

  if (!loaded) return <p role="status" className="type-body-md text-neutral-700">Loading your cart…</p>;
  if (!cart) return <Notice>{error ?? "We couldn't load your cart."}</Notice>;

  if (cart.items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-space-md p-space-xl text-center">
        <h2 className="type-headline-md">Your cart is empty</h2>
        <p className="type-body-md max-w-md text-neutral-700">Choose a package to get ad credits for publishing your listings.</p>
        <Link href="/packages" className="btn btn-primary">See packages</Link>
      </div>
    );
  }

  const unavailable = cart.items.some((i) => !i.available);

  return (
    <div className="grid gap-space-lg lg:grid-cols-[1fr_22rem] lg:items-start">
      <section aria-label="Cart items" className="flex flex-col gap-space-md">
        {error && <Notice>{error}</Notice>}
        <ul className="flex flex-col gap-space-md">
          {cart.items.map((item) => (
            <li key={item.id} className="card flex flex-wrap items-center justify-between gap-space-md p-space-md">
              <div className="min-w-0">
                <h2 className="type-headline-sm">{item.package.name}</h2>
                <p className="type-body-sm text-neutral-700">
                  {item.package.adCount} {item.package.adCount === 1 ? "ad" : "ads"} · {duration(item.package)}
                  {item.package.featuredDays > 0 && ` · ${item.package.featuredDays} featured days`}
                </p>
                {!item.available && <p role="alert" className="type-body-sm text-error">This package is no longer available. Remove it to continue.</p>}
              </div>
              <div className="flex items-center gap-space-md">
                <div className="flex items-center gap-1" role="group" aria-label={`Quantity of ${item.package.name}`}>
                  <button type="button" disabled={busy} onClick={() => setQuantity(item.package.id, item.quantity - 1)} aria-label="Decrease quantity" className="btn btn-secondary btn-icon btn-sm"><Minus aria-hidden="true" /></button>
                  <span aria-live="polite" className="w-8 text-center font-mono">{item.quantity}</span>
                  <button type="button" disabled={busy || item.quantity >= 100} onClick={() => setQuantity(item.package.id, item.quantity + 1)} aria-label="Increase quantity" className="btn btn-secondary btn-icon btn-sm"><Plus aria-hidden="true" /></button>
                </div>
                <p className="price w-24 text-right"><span className="price-amount">{formatAed(item.lineTotal)}</span></p>
                <button type="button" disabled={busy} onClick={() => setQuantity(item.package.id, 0)} aria-label={`Remove ${item.package.name}`} className="btn btn-ghost btn-icon btn-sm"><Trash2 aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" disabled={busy} onClick={empty} className="btn btn-ghost btn-sm self-start">Empty cart</button>
      </section>

      <aside aria-label="Order summary" className="card flex flex-col gap-space-md p-space-lg lg:sticky lg:top-24">
        <h2 className="type-headline-sm">Order summary</h2>
        <dl className="flex flex-col gap-space-sm">
          <div className="flex justify-between"><dt className="type-body-md text-neutral-700">Ad credits</dt><dd className="type-body-md">{cart.adCredits}</dd></div>
          <div className="flex justify-between border-t border-neutral-200 pt-space-sm"><dt className="type-headline-sm">Total</dt><dd className="price"><span className="price-amount">{formatAed(cart.total)}</span></dd></div>
        </dl>
        {payError && <Notice>{payError}</Notice>}
        <button type="button" onClick={checkout} disabled={paying || busy || unavailable} className="btn btn-primary w-full">{paying ? "Redirecting to payment…" : "Pay securely"}</button>
        <p className="type-body-sm text-neutral-700">You&apos;ll pay on Stripe&apos;s secure page. We never see your card details.</p>
      </aside>
    </div>
  );
}
