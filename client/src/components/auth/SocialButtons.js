const API = process.env.NEXT_PUBLIC_API_BASE_URL;

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);
const FacebookIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
    <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);

const PROVIDERS = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
];

// "Continue with Google / Facebook" buttons. They are plain links: the whole sign-in happens on the API and the
// provider's own pages, then the person lands back on the site signed in. Only providers the API has keys for are shown.
export default function SocialButtons({ providers, next, verb = "Continue" }) {
  const enabled = PROVIDERS.filter((p) => providers?.[p.id]);
  if (!enabled.length) return null;

  // Side by side with just the brand name when there are two (they are still announced in full), one wide button otherwise.
  const pair = enabled.length > 1;
  return (
    <div className="flex flex-col gap-space-sm">
      <div className={pair ? "grid grid-cols-2 gap-space-sm" : "flex flex-col"}>
        {enabled.map(({ id, label, Icon }) => (
          <a key={id} href={`${API}/auth/${id}${next ? `?next=${encodeURIComponent(next)}` : ""}`} aria-label={`${verb} with ${label}`} className="btn btn-ghost w-full justify-center gap-2 border-neutral-200 bg-white">
            <Icon />
            {pair ? label : `${verb} with ${label}`}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-3" role="separator" aria-label="or">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="type-label-mono-md text-neutral-700 uppercase">or with email</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
    </div>
  );
}
