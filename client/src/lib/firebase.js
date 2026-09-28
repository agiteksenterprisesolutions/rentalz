"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

// Client-only: Firebase's web SDK expects a browser (it touches window/indexedDB), and this file is only ever
// imported from client components. These config values are meant to be public — Firebase's own security comes
// from its rules and from checking the ID token server-side (see server/src/services/firebase-auth.service.js),
// not from keeping this object secret — but it still lives in an env var, like the site's other public keys.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// getApps().length guards against re-initializing on every hot reload / re-render in dev.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// select_account: always show the account chooser, even if the browser only has one Google session, so
// switching accounts doesn't require signing out of Google itself first.
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
