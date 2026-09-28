import jwt from "jsonwebtoken";

// Verifies a Firebase ID token the way Firebase's own docs describe doing it "without the Admin SDK": a
// Firebase ID token is an ordinary RS256 JWT, signed with a key Google publishes and rotates itself, so it
// can be checked here directly instead of installing the (much heavier) firebase-admin SDK and managing a
// service-account key file just to verify a signature.
const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const ISSUER_PREFIX = "https://securetoken.google.com/";
const MIN_CACHE_SECONDS = 300; // never re-fetch more often than this, even if Google's header says to

let certsCache = { byKid: null, expiresAt: 0 };

const fetchCerts = async () => {
    if (certsCache.byKid && Date.now() < certsCache.expiresAt) return certsCache.byKid;

    const res = await fetch(CERTS_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Could not fetch Firebase signing certificates (Google answered ${res.status})`);
    const byKid = await res.json();

    // Google sends how long these certs are good for; reuse them for that long instead of fetching on every login.
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1]) || MIN_CACHE_SECONDS;
    certsCache = { byKid, expiresAt: Date.now() + Math.max(maxAge, MIN_CACHE_SECONDS) * 1000 };
    return byKid;
};

/**
 * Verifies a Firebase ID token (what the browser gets back from `getIdToken()` after `signInWithPopup`) and
 * returns its decoded claims: { sub, email, email_verified, name, firebase: { sign_in_provider, identities } }.
 * Throws jsonwebtoken's own JsonWebTokenError / TokenExpiredError on a bad or stale token — the API's global
 * error handler already turns those into a clean 401.
 */
export const verifyFirebaseIdToken = async (idToken) => {
    if (!idToken || typeof idToken !== "string") throw new jwt.JsonWebTokenError("Missing ID token");

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured");

    const decodedHeader = jwt.decode(idToken, { complete: true })?.header;
    const cert = decodedHeader?.kid && (await fetchCerts())[decodedHeader.kid];
    if (!cert) throw new jwt.JsonWebTokenError("Unknown signing key");

    return jwt.verify(idToken, cert, {
        algorithms: ["RS256"],
        audience: projectId,
        issuer: `${ISSUER_PREFIX}${projectId}`,
    });
};

/** The Google account id to store as `providerId`: the real Google `sub`, not Firebase's own internal uid. */
export const googleSubOf = (decoded) => decoded.firebase?.identities?.["google.com"]?.[0] || decoded.sub;

