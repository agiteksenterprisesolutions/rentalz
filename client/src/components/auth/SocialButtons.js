"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { safeNextPath } from "@/lib/redirect";
import { useAuthStore } from "@/store/authStore";
import Notice from "./Notice";

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

// "Continue with Google": signs in with Firebase's own popup (no redirect through our API and back), then
// trades the ID token it returns for our session cookies via authStore.googleLogin().
//
// Facebook is deliberately not shown yet — the account-resolution rules already support it (see
// server/src/services/social-auth.service.js and firebaseSignIn), it just isn't wired up on this side yet.
// Bringing it back is a Facebook provider + a second button here, nothing more.
export default function SocialButtons({ next, verb = "Continue" }) {
  const router = useRouter();
  const target = safeNextPath(next);
  const { googleLogin } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await credential.user.getIdToken();
      const result = await googleLogin(idToken);
      if (result.ok) return router.replace(target);
      setError(result.message);
    } catch (err) {
      // The visitor closing the popup or clicking away isn't an error worth showing them.
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-space-sm">
      <Notice>{error}</Notice>
      <button type="button" onClick={onClick} disabled={busy} aria-label={`${verb} with Google`} className="btn btn-ghost w-full justify-center gap-2 border-neutral-200 bg-white">
        <GoogleIcon />
        {busy ? "Continuing…" : `${verb} with Google`}
      </button>
      <div className="flex items-center gap-3" role="separator" aria-label="or">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="type-label-mono-md text-neutral-700 uppercase">or with email</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
    </div>
  );
}
