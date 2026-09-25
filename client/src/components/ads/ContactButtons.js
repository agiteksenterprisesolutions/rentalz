"use client";

import { MessageCircle, Phone } from "lucide-react";

// Call and WhatsApp links. A click is reported to the API (fire and forget) so sellers can see interest;
// the link itself never waits on it.
const track = (adId, type) => {
  try {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ads/${adId}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  } catch {}
};

export default function ContactButtons({ adId, phone, title }) {
  const digits = phone.replace(/\D/g, "");
  // A local number starting with 0 becomes an international one for WhatsApp.
  const whatsapp = digits.startsWith("0") ? `971${digits.slice(1)}` : digits;
  const message = encodeURIComponent(`Hi, I'm interested in your listing "${title}" on TheRentalz.`);

  return (
    <div className="flex flex-col gap-space-sm">
      <a href={`tel:+${whatsapp}`} onClick={() => track(adId, "PHONE")} className="btn btn-primary w-full">
        <Phone aria-hidden="true" />
        Call seller
      </a>
      <a
        href={`https://wa.me/${whatsapp}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track(adId, "WHATSAPP")}
        className="btn btn-secondary w-full"
      >
        <MessageCircle aria-hidden="true" />
        WhatsApp
      </a>
      <p className="type-label-mono-md text-center text-neutral-700">{phone}</p>
    </div>
  );
}
