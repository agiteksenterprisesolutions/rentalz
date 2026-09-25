"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Field from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import useFetch from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { formatAed } from "@/utils/format";
import { api, dateOnly, useRun } from "./parts";

export default function AdminUserDetail({ id }) {
  const router = useRouter();
  const can = useAuthStore((s) => s.can);
  const me = useAuthStore((s) => s.user);
  const { data: u, error, loading, reload } = useFetch(`/admin/users/${id}`);
  const { busy, error: runError, run } = useRun();
  const [notice, setNotice] = useState(null);
  const isSelf = me?.id === id;

  const doit = async (fn, text) => {
    const { ok } = await run(fn);
    if (ok) { setNotice(text); reload(); }
  };

  return (
    <>
      <PageHeading title={u?.name ?? "User"} subtitle={u?.email} action={<Link href="/admin/users" className="btn btn-ghost btn-sm">All users</Link>} />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {u && (
          <div className="flex max-w-3xl flex-col gap-space-lg">
            {runError && <Notice>{runError}</Notice>}
            {notice && <Notice tone="success">{notice}</Notice>}

            <section className="card grid gap-space-md p-space-lg sm:grid-cols-2" aria-label="Account">
              {[["Role", u.role], ["Status", u.status], ["Email verified", u.emailVerified ? "Yes" : "No"], ["Sign-in", u.provider === "local" ? "Password" : u.provider], ["Joined", dateOnly(u.createdAt)], ["Phone", u.phone ?? "—"], ["Ad credits", u.adCredits], ["Paid orders", `${u.paidOrders} (${formatAed(u.totalSpent)})`]].map(([k, v]) => (
                <div key={k}><p className="type-label-mono-md text-neutral-700 uppercase">{k}</p><p className="type-body-md">{v}</p></div>
              ))}
              <div className="sm:col-span-2"><p className="type-label-mono-md text-neutral-700 uppercase">Ads</p><p className="type-body-md">{Object.entries(u.ads).map(([s, c]) => `${s.toLowerCase()}: ${c}`).join(" · ") || "None"}</p></div>
            </section>

            {isSelf ? <Notice tone="success">This is your own account, so status, role and deletion are locked.</Notice> : (
              <section className="card flex flex-col gap-space-md p-space-lg" aria-label="Manage account">
                <h2 className="type-headline-sm">Manage</h2>
                <div className="flex flex-wrap gap-2">
                  {can("user:block") && (u.status === "BLOCKED"
                    ? <button type="button" disabled={busy} onClick={() => doit(() => api.patch(`/admin/users/${id}/status`, { status: "ACTIVE" }), "User unblocked.")} className="btn btn-secondary btn-sm">Unblock</button>
                    : <button type="button" disabled={busy} onClick={() => window.confirm("Block this user? Their sessions end immediately.") && doit(() => api.patch(`/admin/users/${id}/status`, { status: "BLOCKED" }), "User blocked.")} className="btn btn-secondary btn-sm">Block</button>)}
                  {can("user:delete") && <button type="button" disabled={busy} onClick={async () => { if (window.confirm("Delete this user? Their ads leave the site.")) { const { ok } = await run(() => api.delete(`/admin/users/${id}`)); if (ok) router.push("/admin/users"); } }} className="btn btn-danger btn-sm">Delete user</button>}
                </div>
                {can("user:change-role") && (
                  <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); doit(() => api.patch(`/admin/users/${id}/role`, { role: new FormData(e.currentTarget).get("role") }), "Role changed. The user must sign in again."); }}>
                    <div className="flex-1"><label htmlFor="role" className="label">Role</label>
                      <select id="role" name="role" defaultValue={u.role} className="select">{["USER", "MODERATOR", "ADMIN"].map((r) => <option key={r}>{r}</option>)}</select></div>
                    <button type="submit" disabled={busy} className="btn btn-secondary">Change role</button>
                  </form>
                )}
              </section>
            )}

            {can("user:update") && (
              <form className="card flex flex-col gap-space-md p-space-lg" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget; doit(async () => { await api.post(`/admin/users/${id}/credits`, { credits: Number(f.get("credits")), featuredDays: Number(f.get("featuredDays") || 0), durationDays: Number(f.get("durationDays") || 30), note: f.get("note") }); form.reset(); }, "Credits granted."); }}>
                <h2 className="type-headline-sm">Grant ad credits</h2>
                <div className="grid gap-space-md sm:grid-cols-3">
                  <Field label="Credits" name="credits" type="number" min="1" max="1000" required />
                  <Field label="Featured days" name="featuredDays" type="number" min="0" defaultValue="0" />
                  <Field label="Run length (days)" name="durationDays" type="number" min="1" defaultValue="30" />
                </div>
                <Field label="Note (audit log)" name="note" maxLength={200} />
                <button type="submit" disabled={busy} className="btn btn-primary self-start">Grant credits</button>
              </form>
            )}

            {u.creditLots?.length > 0 && (
              <section className="card p-space-lg" aria-label="Credit lots">
                <h2 className="type-headline-sm mb-space-sm">Credit lots</h2>
                <ul className="flex flex-col gap-1">
                  {u.creditLots.map((l) => <li key={l.id} className="type-body-sm text-neutral-700">{dateOnly(l.createdAt)} · {l.source} · {l.remaining} of {l.granted} left · {l.durationDays} days{l.featuredDays ? ` · ${l.featuredDays} featured` : ""}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
      </LoadState>
    </>
  );
}
