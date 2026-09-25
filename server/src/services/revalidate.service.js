// Asks the Next.js frontend to drop its cached copies of the given lists ("cities", "makes", "categories"),
// so an admin edit shows on the public site straight away. Fire and forget: if the frontend is down or the
// secret is missing the edit itself still succeeds, and the frontend's own hourly refresh catches up.
export const revalidateFrontend = (...tags) => {
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
        console.warn("REVALIDATE_SECRET is not set: the frontend will show this change within the hour");
        return;
    }
    fetch(`${process.env.CORS_ORIGIN}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(5000),
    })
        .then((res) => {
            if (!res.ok) console.error(`Frontend revalidation for ${tags.join(", ")} answered ${res.status}`);
        })
        .catch((error) => console.error(`Frontend revalidation for ${tags.join(", ")} failed: ${error.message}`));
};
