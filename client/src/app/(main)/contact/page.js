import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import { getSeoSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { CONTACT } from "@/utils/constants";

export async function generateMetadata() {
  return buildMetadata(await getSeoSettings(), "contact", {
    path: "/contact",
    title: "Contact TheRentalz",
    description: "Questions about a listing, your account or an ad package? Get in touch with the TheRentalz team.",
  });
}

const DETAILS = [
  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Phone, label: "Phone", value: CONTACT.phone, href: CONTACT.phoneHref },
  { icon: MapPin, label: "Based in", value: CONTACT.location },
];

export default function ContactPage() {
  return (
    <div className="container-page py-space-xl">
      <header className="mb-space-xl max-w-2xl">
        <h1 className="type-headline-lg">Contact us</h1>
        <p className="type-body-lg mt-space-sm text-neutral-700">Questions about a listing, your account or an ad package? Send us a message and we&apos;ll get back to you.</p>
      </header>
      <div className="grid gap-space-lg lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="card p-space-lg md:p-space-xl">
          <ContactForm />
        </div>
        <aside aria-label="Contact details" className="card flex flex-col gap-space-md p-space-lg">
          {DETAILS.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon aria-hidden="true" className="mt-1 size-5 shrink-0 text-amber-deep" />
              <div>
                <p className="type-label-mono-md text-neutral-700 uppercase">{label}</p>
                {href ? <a href={href} className="type-body-md font-medium hover:underline">{value}</a> : <p className="type-body-md font-medium">{value}</p>}
              </div>
            </div>
          ))}
          <p className="type-body-sm border-t border-neutral-200 pt-space-md text-neutral-700">Looking for a specific machine? The seller&apos;s phone and WhatsApp are on each listing.</p>
        </aside>
      </div>
    </div>
  );
}
