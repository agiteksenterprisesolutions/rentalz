import Link from "next/link";

// Default buttons for the 404 page.
export default function NotFoundActions() {
  return (
    <>
      <Link href="/" className="btn btn-primary">Back to home</Link>
      <Link href="/ads" className="btn btn-secondary">Browse listings</Link>
      <Link href="/contact" className="btn btn-ghost">Contact us</Link>
    </>
  );
}
