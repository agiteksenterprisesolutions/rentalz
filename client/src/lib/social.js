// Messages for the ?error= codes the API's social sign-in callback adds to /login.
export const SOCIAL_ERRORS = {
  social_failed: "We couldn't sign you in with that account. Please try again, or use your email and password.",
  social_cancelled: "Sign-in was cancelled. You can try again whenever you like.",
  social_no_email: "That account didn't share an email address, and we need one to create your account. Please use a different sign-in method.",
  social_unverified: "That provider hasn't verified your email address, so we can't use it to sign you in.",
  social_blocked: "This account has been blocked. If you think that's a mistake, please contact us.",
  social_deleted: "That email belongs to a deleted account. Please contact us, or use a different email.",
  social_unavailable: "Signing in with that provider isn't available right now.",
};
