"use client";

import { useState } from "react";
import Field from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import useFetch from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { formatAed } from "@/utils/format";
import { api, useRun } from "./parts";

function PackageForm({ pkg, categories, onDone, onCancel }) {
  const { busy, error, run } = useRun();
  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      categoryId: Number(f.get("categoryId")), name: f.get("name").trim(), details: f.get("details").trim(),
      adCount: Number(f.get("adCount")), durationValue: Number(f.get("durationValue")), durationUnit: f.get("durationUnit"),
      amount: Number(f.get("amount")), featuredDays: Number(f.get("featuredDays") || 0),
      hasAnalytics: f.get("hasAnalytics") === "on", hasSupport: f.get("hasSupport") === "on", isActive: f.get("isActive") === "on",
    };
    const { ok } = await run(() => (pkg ? api.patch(`/packages/${pkg.id}`, body) : api.post("/packages", body)));
    if (ok) onDone();
  };
  const v = pkg ?? { adCount: 1, durationValue: 30, durationUnit: "DAY", featuredDays: 0, hasSupport: true, isActive: true };
  return (
    <form onSubmit={submit} className="card flex flex-col gap-space-md p-space-lg">
      <h2 className="type-headline-sm">{pkg ? `Edit ${pkg.name}` : "New package"}</h2>
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-space-md sm:grid-cols-2">
        <div><label htmlFor="categoryId" className="label">Group</label><select id="categoryId" name="categoryId" defaultValue={v.categoryId} required className="select">{categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <Field label="Name" name="name" required defaultValue={v.name ?? ""} />
        <Field label="Price (AED)" name="amount" type="number" min="1" step="0.01" required defaultValue={v.amount ? Number(v.amount) : ""} />
        <Field label="Ads (credits)" name="adCount" type="number" min="1" required defaultValue={v.adCount} />
        <Field label="Run length" name="durationValue" type="number" min="1" required defaultValue={v.durationValue} />
        <div><label htmlFor="durationUnit" className="label">Unit</label><select id="durationUnit" name="durationUnit" defaultValue={v.durationUnit} className="select"><option value="DAY">Days</option><option value="MONTH">Months</option></select></div>
        <Field label="Featured days per ad" name="featuredDays" type="number" min="0" defaultValue={v.featuredDays} />
      </div>
      <Field label="Details (optional)" name="details" defaultValue={v.details ?? ""} />
      <div className="flex flex-wrap gap-space-lg">
        {[["hasAnalytics", "Statistics"], ["hasSupport", "Support"], ["isActive", "Active (on sale)"]].map(([n, l]) => <label key={n} className="check-row"><input type="checkbox" name={n} defaultChecked={Boolean(v[n])} className="checkbox" /><span className="type-body-sm">{l}</span></label>)}
      </div>
      <div className="flex gap-2"><button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save package"}</button><button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button></div>
    </form>
  );
}

export default function AdminPackages() {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/packages/manage");
  const [editing, setEditing] = useState(null); // package | "new"
  const { busy, error: runError, run } = useRun();

  const done = () => { setEditing(null); reload(); };
  return (
    <>
      <PageHeading title="Packages" subtitle="Existing orders keep the price they were bought at; carts see the new price." action={can("package:create") && <button type="button" onClick={() => setEditing("new")} className="btn btn-primary">New package</button>} />
      {runError && <Notice>{runError}</Notice>}
      {editing && <div className="mb-space-lg"><PackageForm pkg={editing === "new" ? null : editing} categories={data ?? []} onDone={done} onCancel={() => setEditing(null)} /></div>}
      <LoadState loading={loading} error={error} onRetry={reload}>
        <div className="flex flex-col gap-space-lg">
          {(data ?? []).map((g) => (
            <section key={g.id} aria-labelledby={`g${g.id}`}>
              <h2 id={`g${g.id}`} className="type-headline-sm mb-space-sm">{g.title}</h2>
              <ul className="flex flex-col gap-space-sm">
                {g.packages.map((p) => (
                  <li key={p.id} className="card flex flex-wrap items-center justify-between gap-space-md p-space-md">
                    <div>
                      <p className="type-body-md font-medium">{p.name} {!p.isActive && <span className="pill pill-sm ml-2">Inactive</span>}</p>
                      <p className="type-body-sm text-neutral-700">{formatAed(p.amount)} · {p.adCount} {p.adCount === 1 ? "ad" : "ads"} · {p.durationValue} {p.durationUnit.toLowerCase()}(s){p.featuredDays ? ` · ${p.featuredDays} featured days` : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      {can("package:update") && <button type="button" onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn btn-secondary btn-sm">Edit</button>}
                      {can("package:delete") && <button type="button" disabled={busy} onClick={async () => { if (window.confirm(`Delete ${p.name}? Packages that were ordered can only be deactivated.`)) { const { ok } = await run(() => api.delete(`/packages/${p.id}`)); if (ok) reload(); } }} className="btn btn-ghost btn-sm">Delete</button>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </LoadState>
    </>
  );
}
