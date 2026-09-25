"use client";

import Link from "next/link";
import { useEffect } from "react";
import StatusPage from "./StatusPage";

// Shared body of the error pages. The technical message stays in the console; visitors get a plain
// explanation and, when the server gave one, a short reference to quote to support.
export default function ErrorView({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500 · Something went wrong"
      title="We hit a problem"
      text="Something went wrong on our side. It's not you. Try again, and if it keeps happening, let us know."
      note={error?.digest ? `Reference: ${error.digest}` : undefined}
    >
      <button type="button" onClick={() => retry()} className="btn btn-primary">Try again</button>
      <Link href="/" className="btn btn-secondary">Back to home</Link>
      <Link href="/contact" className="btn btn-ghost">Contact us</Link>
    </StatusPage>
  );
}
