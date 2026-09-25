import LegalPage from "@/components/ui/LegalPage";
import { CONTACT } from "@/utils/constants";

export const metadata = { title: "Terms and conditions | TheRentalz", alternates: { canonical: "/terms" } };

const SECTIONS = [
  { title: "About TheRentalz", body: ["TheRentalz is an online marketplace where people and businesses in the United Arab Emirates list equipment and vehicles for rent or sale, and where visitors find and contact them. We provide the platform. We are not a party to any rental or sale agreed between a seller and a buyer."] },
  { title: "Your account", body: ["You must give accurate details when you register and keep your password secret. You are responsible for what happens under your account. Tell us straight away if you think someone else has used it.", "We may suspend or close accounts that break these terms or that we reasonably believe are being used for fraud or misuse."] },
  { title: "Posting ads", body: ["Every ad is reviewed before it is published, and we may reject, edit or remove an ad at any time. When you post an ad you confirm that:", ["you own the equipment or vehicle, or are authorised to rent or sell it;", "the title, description, photos, price and contact details are accurate and not misleading;", "you have the right to use the photos you upload;", "the item and the ad comply with UAE law."], "Do not post prohibited, stolen or counterfeit items, or use ads to collect personal data or promote unrelated services."] },
  { title: "Ad packages and payments", body: ["Ads are published using ad credits bought as packages. A credit is used when an ad is approved and publishes that ad for the period stated in the package. Featured days, where included, start when the ad is approved.", "Payments are taken by our payment provider, Stripe, and prices are shown in UAE dirhams (AED). We never see or store your card details.", "If an order is refunded, credits you have not used are withdrawn. Credits already used stay used, and those ads keep running until they expire. Unused credits are lost if you delete your account."] },
  { title: "Deals between users", body: ["Buyers and sellers deal with each other directly. Check the equipment, the seller and the terms yourself before you pay or hand anything over, and agree deposits, insurance, delivery and returns in writing. We do not guarantee the quality, safety, legality or availability of any listed item, or that a buyer or seller will complete a deal."] },
  { title: "Acceptable use", body: ["You must not misuse the site. In particular, do not:", ["attempt to gain unauthorised access to the site or other accounts;", "scrape or copy listings on a large scale, or resell our content;", "send spam or harassing messages through contact details on ads;", "interfere with the operation or security of the service."]] },
  { title: "Our content", body: ["The TheRentalz name, logo, design and software belong to us or our licensors. You keep the rights to the content you post, and you give us a non-exclusive licence to display, store and promote it on the site and in our marketing while it is listed."] },
  { title: "Liability", body: ["We provide the site on an “as is” basis. To the extent the law allows, we are not liable for losses arising from deals between users, from ads or content posted by users, or from interruptions to the site. Nothing in these terms limits liability that cannot be limited by law."] },
  { title: "Changes and governing law", body: ["We may update these terms. If we make a significant change we will say so on the site, and continuing to use it means you accept the updated terms. These terms are governed by the laws of the United Arab Emirates."] },
  { title: "Contact", body: [`Questions about these terms? Email ${CONTACT.email}.`] },
];

export default function TermsPage() {
  return <LegalPage title="Terms and conditions" updated="19 September 2026" intro="Please read these terms before you use TheRentalz. By using the site or posting an ad, you agree to them." sections={SECTIONS} />;
}
