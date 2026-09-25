"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/api/api";
import Notice from "@/components/auth/Notice";
import { apiError } from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatAed } from "@/utils/format";

// Where Stripe sends the buyer back to. The API asks Stripe for the real payment state, so nothing here
// trusts the URL. A payment can be a moment late, so "pending" offers a re-check.
export default function CheckoutResult({ orderId }) {
  const [state, setState] = useState(orderId ? { status: "checking" } : { status: "error", message: "This page needs an order reference." });
  const asked = useRef(false);

  const check = useCallback(async () => {
    setState({ status: "checking" });
    try {
      const { data } = await api.post("/payments/confirm", { orderId });
      const order = data.data;
      if (order.status === "PAID") {
        useCartStore.getState().load();
        useAuthStore.getState().fetchMe(); // refreshes the credit balance
      }
      setState({ status: order.status, order });
    } catch (e) {
      setState({ status: "error", message: apiError(e, "We couldn't check your payment.") });
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId || asked.current) return;
    asked.current = true;
    check();
  }, [orderId, check]);

  const { status, order, message } = state;
  return (
    <div className="card flex max-w-xl flex-col gap-space-md p-space-lg">
      {status === "checking" && <p role="status" className="type-body-md text-neutral-700">Confirming your payment…</p>}
      {status === "PAID" && (
        <>
          <h1 className="type-headline-lg">Payment received</h1>
          <Notice tone="success">Thank you. {formatAed(order.total)} was paid and your ad credits have been added.</Notice>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/ads/new" className="btn btn-primary">Post an ad</Link>
            <Link href="/dashboard/orders" className="btn btn-secondary">View orders</Link>
          </div>
        </>
      )}
      {status === "PENDING" && (
        <>
          <h1 className="type-headline-lg">Payment processing</h1>
          <Notice tone="success">Your payment hasn&apos;t been confirmed yet. This can take a minute.</Notice>
          <button type="button" onClick={check} className="btn btn-primary self-start">Check again</button>
        </>
      )}
      {(status === "FAILED" || status === "REFUNDED") && (
        <>
          <h1 className="type-headline-lg">{status === "FAILED" ? "Payment not completed" : "Order refunded"}</h1>
          <Notice>{status === "FAILED" ? "You haven't been charged for this order. Your cart is still there if you want to try again." : "This order was refunded."}</Notice>
          <Link href="/cart" className="btn btn-primary self-start">Back to cart</Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="type-headline-lg">Something went wrong</h1>
          <Notice>{message}</Notice>
          <div className="flex gap-2">
            {orderId && <button type="button" onClick={check} className="btn btn-primary">Try again</button>}
            <Link href="/dashboard/orders" className="btn btn-secondary">View orders</Link>
          </div>
        </>
      )}
    </div>
  );
}
