"use client";

import Image from "next/image";
import { useState } from "react";
import Field from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import useFetch from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { api, useRun } from "./parts";

const LEVEL_NAMES = { 1: "Category", 2: "Sub-category", 3: "Type" };

// Create / edit form. Parent and level are fixed once a category exists (the API enforces it).
function CategoryForm({ category, parent, onDone, onCancel }) {
  const { busy, error, run } = useRun();
  const editing = Boolean(category);

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = new FormData();
    body.append("title", f.get("title").trim());
    body.append("sortOrder", f.get("sortOrder") || "0");
    body.append("isPopular", f.get("isPopular") === "on");
    if (editing) body.append("isActive", f.get("isActive") === "on");
    else if (parent) body.append("parentId", parent.id);
    const image = f.get("image");
    if (image && image.size > 0) body.append("image", image);
    const { ok } = await run(() => (editing ? api.patch(`/categories/${category.id}`, body) : api.post("/categories", body)));
    if (ok) onDone();
  };

  const level = editing ? category.level : (parent?.level ?? 0) + 1;
  return (
    <form onSubmit={submit} className="card flex flex-col gap-space-md p-space-lg">
      <h2 className="type-headline-sm">{editing ? `Edit ${category.title}` : parent ? `New sub-category of ${parent.title}` : "New top-level category"}</h2>
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-space-md sm:grid-cols-2">
        <Field label="Title" name="title" required maxLength={191} defaultValue={category?.title ?? ""} />
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} hint="Lower numbers come first" />
      </div>
      <div>
        <label htmlFor="image" className="label">Image (optional, JPG, PNG or WebP up to 5 MB)</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input h-auto py-2" />
      </div>
      <div className="flex flex-wrap gap-space-lg">
        <label className="check-row"><input type="checkbox" name="isPopular" defaultChecked={category?.isPopular} className="checkbox" /><span className="type-body-sm">Show on the home page{level > 2 ? "" : " (popular)"}</span></label>
        {editing && <label className="check-row"><input type="checkbox" name="isActive" defaultChecked={category.isActive} className="checkbox" /><span className="type-body-sm">Active (visible on the site)</span></label>}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function Node({ node, depth, can, busy, onEdit, onAdd, onDelete }) {
  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 py-space-sm" style={{ paddingLeft: `${depth * 1.5}rem` }}>
        <div className="flex min-w-0 items-center gap-3">
          {node.imageUrl && <span className="card-media relative size-9 shrink-0"><Image src={node.imageUrl} alt="" fill sizes="36px" className="object-cover" /></span>}
          <div className="min-w-0">
            <p className="type-body-md font-medium">{node.title}{!node.isActive && <span className="pill pill-sm ml-2">Inactive</span>}{node.isPopular && <span className="pill pill-available pill-sm ml-2">Popular</span>}</p>
            <p className="type-label-mono-md text-neutral-700">{LEVEL_NAMES[node.level]} · /{node.slug}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {can("category:update") && <button type="button" onClick={() => onEdit(node)} className="btn btn-secondary btn-sm">Edit</button>}
          {can("category:create") && node.level < 3 && <button type="button" onClick={() => onAdd(node)} className="btn btn-ghost btn-sm">Add sub</button>}
          {can("category:delete") && <button type="button" disabled={busy} onClick={() => onDelete(node)} className="btn btn-ghost btn-sm">Delete</button>}
        </div>
      </div>
      {node.children?.length > 0 && (
        <ul>{node.children.map((c) => <Node key={c.id} node={c} depth={depth + 1} can={can} busy={busy} onEdit={onEdit} onAdd={onAdd} onDelete={onDelete} />)}</ul>
      )}
    </li>
  );
}

export default function AdminCategories() {
  const can = useAuthStore((s) => s.can);
  const { data, error, loading, reload } = useFetch("/categories/manage");
  const { busy, error: runError, run } = useRun();
  const [form, setForm] = useState(null); // { category?, parent? }

  const done = () => { setForm(null); reload(); };
  const remove = async (node) => {
    if (!window.confirm(`Delete “${node.title}”? Categories with sub-categories or ads can't be deleted; deactivate them instead.`)) return;
    const { ok } = await run(() => api.delete(`/categories/${node.id}`));
    if (ok) reload();
  };

  return (
    <>
      <PageHeading title="Categories" subtitle="Up to three levels: category, sub-category, type. Inactive categories are hidden from the site." action={can("category:create") && <button type="button" onClick={() => setForm({})} className="btn btn-primary">New category</button>} />
      {runError && <div className="mb-space-md"><Notice>{runError}</Notice></div>}
      {form && <div className="mb-space-lg"><CategoryForm key={form.category?.id ?? `new-${form.parent?.id ?? 0}`} category={form.category} parent={form.parent} onDone={done} onCancel={() => setForm(null)} /></div>}
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="card px-space-md">
            <ul>
              {data.map((n) => <Node key={n.id} node={n} depth={0} can={can} busy={busy} onEdit={(category) => { setForm({ category }); window.scrollTo({ top: 0, behavior: "smooth" }); }} onAdd={(parent) => { setForm({ parent }); window.scrollTo({ top: 0, behavior: "smooth" }); }} onDelete={remove} />)}
            </ul>
          </div>
        )}
      </LoadState>
    </>
  );
}
