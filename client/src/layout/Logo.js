import Image from "next/image";
import Link from "next/link";

// The logo artwork is amber on a transparent background, so it reads on both the light header and the dark footer.
export default function Logo({ size = "md" }) {
  const height = size === "lg" ? "h-20" : "h-14";
  return (
    <Link href="/" aria-label="TheRentalz home" className="inline-flex shrink-0 items-center">
      <Image src="/theRentalz_logo.png" alt="" width={225} height={198} priority className={`${height} w-auto`} />
    </Link>
  );
}
