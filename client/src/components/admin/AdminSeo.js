"use client";

import { useState } from "react";
import Field from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import useFetch from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { api, useRun } from "./parts";

const keywordsOf = (text) => text.split(",").map((k) => k.trim()).filter(Boolean);

function Defaults({ value, canEdit, onSaved }) {
  const { busy, error, run } = useRun();
  const [saved, setSaved] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { siteName: f.get("siteName").trim(), titleTemplate: f.get("titleTemplate").trim(), title: f.get("title").trim(), description: f.get("description").trim(), keywords: keywordsOf(f.get("keywords")), ogImageUrl: f.get("ogImageUrl").trim() };
    setSaved(false);
    const { ok } = await run(() => api.put("/admin/settings/seo.default", body));
    if (ok) { setSaved(true); onSaved(); }
  };
  return (
    <form onSubmit={submit} className="card flex flex-col gap-space-md p-space-lg">
      <h2 className="type-headline-sm">Site defaults</h2>
      {error && <Notice>{error}</Notice>}
      {saved && <Notice tone="success">Saved. Pages pick it up within a few minutes.</Notice>}
      <fieldset disabled={!canEdit} className="flex flex-col gap-space-md">
        <Field label="Site name" name="siteName" defaultValue={value.siteName ?? ""} />
        <Field label="Title template" name="titleTemplate" defaultValue={value.titleTemplate ?? ""} hint="Use %s where the page title goes" />
        <Field label="Home page title" name="title" defaultValue={value.title ?? ""} maxLength={70} />
        <div><label htmlFor="description" className="label">Description</label><textarea id="description" name="description" rows={3} maxLength={320} defaultValue={value.description ?? ""} className="textarea" /></div>
        <Field label="Keywords (comma separated)" name="keywords" defaultValue={(value.keywords ?? []).join(", ")} />
        <Field label="Share image URL (https)" name="ogImageUrl" type="url" defaultValue={value.ogImageUrl ?? ""} />
      </fieldset>
      {canEdit && <button type="submit" disabled={busy} className="btn btn-primary self-start">{busy ? "Saving…" : "Save defaults"}</button>}
    </form>
  );
}

// Per-page overrides, keyed by page slug (home, ads, categories, packages, contact, category-<slug>…).
function Pages({ value, canEdit, onSaved }) {
  const { busy, error, run } = useRun();
  const [rows, setRows] = useState(() => Object.entries(value).map(([key, v]) => ({ key, title: v.title ?? "", description: v.description ?? "", keywords: (v.keywords ?? []).join(", ") })));
  const [saved, setSaved] = useState(false);
  const set = (i, field, val) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [field]: val } : row)));

  const submit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), { title: r.title.trim(), description: r.description.trim(), keywords: keywordsOf(r.keywords) }]));
    setSaved(false);
    const { ok } = await run(() => api.put("/admin/settings/seo.pages", body));
    if (ok) { setSaved(true); onSaved(); }
  };
  return (
    <form onSubmit={submit} className="card flex flex-col gap-space-md p-space-lg">
      <div>
        <h2 className="type-headline-sm">Page overrides</h2>
        <p className="type-body-sm text-neutral-700">Page keys used by the site: <code>home</code>, <code>ads</code>, <code>categories</code>, <code>packages</code>, <code>contact</code>, and <code>category-&lt;slug&gt;</code> for one category.</p>
      </div>
      {error && <Notice>{error}</Notice>}
      {saved && <Notice tone="success">Saved.</Notice>}
      <fieldset disabled={!canEdit} className="flex flex-col gap-space-lg">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-space-sm rounded-control border border-neutral-200 p-space-md">
            <Field label="Page key" value={r.key} onChange={(e) => set(i, "key", e.target.value)} />
            <Field label="Title" value={r.title} onChange={(e) => set(i, "title", e.target.value)} maxLength={70} />
            <Field label="Description" value={r.description} onChange={(e) => set(i, "description", e.target.value)} maxLength={320} />
            <Field label="Keywords" value={r.keywords} onChange={(e) => set(i, "keywords", e.target.value)} />
            <button type="button" onClick={() => setRows((all) => all.filter((_, j) => j !== i))} className="btn btn-ghost btn-sm self-start">Remove</button>
          </div>
        ))}
      </fieldset>
      {canEdit && (
        <div className="flex gap-2">
          <button type="button" onClick={() => setRows((r) => [...r, { key: "", title: "", description: "", keywords: "" }])} className="btn btn-secondary">Add page</button>
          <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save overrides"}</button>
        </div>
      )}
    </form>
  );
}

export default function AdminSeo() {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/admin/settings");
  const canEdit = can("setting:update");
  return (
    <>
      <PageHeading title="SEO settings" subtitle="Titles and descriptions search engines and social previews use." />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="flex max-w-2xl flex-col gap-space-lg">
            <Defaults value={data["seo.default"] ?? {}} canEdit={canEdit} onSaved={() => {}} />
            <Pages value={data["seo.pages"] ?? {}} canEdit={canEdit} onSaved={() => {}} />
          </div>
        )}
      </LoadState>
    </>
  );
}
