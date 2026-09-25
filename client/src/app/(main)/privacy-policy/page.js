import LegalPage from "@/components/ui/LegalPage";
import { CONTACT } from "@/utils/constants";

export const metadata = { title: "Privacy policy | TheRentalz", alternates: { canonical: "/privacy-policy" } };

const SECTIONS = [
  { title: "Who we are", body: [`TheRentalz (“we”, “us”) runs the marketplace at therentalz.com. This policy explains what personal information we collect, why, and what your choices are. Contact us at ${CONTACT.email} with any privacy question.`] },
  { title: "What we collect", body: [["Account details: your name, email address, phone number and password (stored only as a secure hash), and optional profile details and picture.", "Your ads: text, prices, photos, location and the phone number you choose to show to buyers.", "Activity: favourites, saved searches, cart and order history, and how many people viewed your ads or tapped call or WhatsApp.", "Messages you send us through the contact form.", "Technical data: IP address, browser type and basic usage data, collected through cookies and similar technology."]] },
  { title: "How we use it", body: [["to run your account, publish and review ads, and let buyers contact you;", "to process payments and keep records of orders;", "to send service emails such as verification, password reset and ad decisions;", "to keep the site secure and prevent fraud and abuse;", "to understand how the site is used and improve it."]] },
  { title: "Who sees it", body: ["Anything you put in an ad, including the phone number, is public. We share data with providers who help us run the service, such as payment processing (Stripe), email delivery, image storage and hosting, and only what they need for that job. We do not sell your personal information. We may disclose information if the law requires it, or to protect our users, our rights or our property."] },
  { title: "Cookies", body: ["We use cookies that keep you signed in and keep the site secure. You can block cookies in your browser, but you may then be unable to sign in or use parts of the site."] },
  { title: "How long we keep it", body: ["We keep your data while your account is open. If you delete your account we remove your name, email, phone, profile and picture and take your ads offline. We keep order and audit records that we need for accounting, legal and security reasons, without your personal details."] },
  { title: "Your choices", body: ["You can update your details, change your email or password, and delete your account from your dashboard. You can also ask us for a copy of your data or ask us to correct it by emailing us."] },
  { title: "Security", body: ["We protect data with encrypted connections, hashed passwords and restricted access. No system is perfectly secure, so please use a strong, unique password."] },
  { title: "Changes to this policy", body: ["We may update this policy and will show the new date above. If a change is significant we will tell you on the site."] },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" updated="19 September 2026" intro="Protecting your privacy matters to us. This is how we handle your information." sections={SECTIONS} />;
}
