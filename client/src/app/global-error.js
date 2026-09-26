"use client";

import "./globals.css";

// Last resort: the root layout itself failed, so this replaces the whole document (including <html>).
// It uses no fonts or components from the layout, only the global styles.
export default function GlobalError({ error, retry }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-neutral-900">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="type-label-mono-md rounded-control border border-neutral-200 bg-white px-3 py-1 tracking-[0.16em] text-neutral-700">500 · Something went wrong</p>
          <h1 className="type-headline-lg">TheRentalz is having trouble</h1>
          <p className="type-body-lg max-w-md text-neutral-700">Please try again in a moment.</p>
          {error?.digest && <p className="type-label-mono-md text-neutral-700">Reference: {error.digest}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => retry()} className="btn btn-primary">Try again</button>
            {/* A plain link on purpose: a full page load clears any broken client state, and the router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn btn-secondary">Back to home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
