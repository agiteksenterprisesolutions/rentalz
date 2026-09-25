"use client";

import { useState } from "react";
import Notice from "@/components/auth/Notice";
import { LoadState, PageHeading } from "@/components/dashboard/parts";
import useFetch from "@/hooks/useFetch";
import { api, Table, Td, useRun } from "./parts";

// Shared editor for the plain name lists (cities, makes): add, rename, delete.
export default function AdminNameList({ endpoint, title, subtitle, noun, showSlug = false, filterable = false }) {
  const { data, error, loading, reload } = useFetch(endpoint);
  const { busy, error: runError, run } = useRun();
  const [editing, setEditing] = useState(null); // { id, name }
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState(null);

  const items = (data ?? []).filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()));

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = new FormData(form).get("name").trim();
    const { ok } = await run(() => api.post(endpoint, { name }));
    if (ok) { form.reset(); setAdded(name); reload(); }
  };
  const rename = async (e) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name").trim();
    const { ok } = await run(() => api.patch(`${endpoint}/${editing.id}`, { name }));
    if (ok) { setEditing(null); reload(); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    const { ok } = await run(() => api.delete(`${endpoint}/${item.id}`));
    if (ok) reload();
  };

  return (
    <>
      <PageHeading title={title} subtitle={subtitle} />
      {runError && <div className="mb-space-md"><Notice>{runError}</Notice></div>}
      {added && !runError && <div className="mb-space-md"><Notice tone="success">“{added}” was added.</Notice></div>}

      <form onSubmit={add} className="mb-space-lg flex max-w-xl items-end gap-space-sm">
        <div className="flex-1">
          <label htmlFor="new-name" className="label">Add a {noun}</label>
          <input id="new-name" name="name" required maxLength={100} className="input" autoComplete="off" />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary">Add</button>
      </form>

      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {filterable && (
              <div className="mb-space-sm max-w-xl">
                <label htmlFor="filter" className="label">Filter {data.length} {noun}s</label>
                <input id="filter" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="input" />
              </div>
            )}
            <Table label={title} columns={showSlug ? ["Name", "Slug", ""] : ["Name", ""]}>
              {items.map((item) => (
                <tr key={item.id}>
                  <Td>
                    {editing?.id === item.id ? (
                      <form onSubmit={rename} className="flex gap-2">
                        <input name="name" required maxLength={100} defaultValue={item.name} aria-label={`New name for ${item.name}`} className="input h-10" autoFocus />
                        <button type="submit" disabled={busy} className="btn btn-primary btn-sm">Save</button>
                        <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost btn-sm">Cancel</button>
                      </form>
                    ) : item.name}
                  </Td>
                  {showSlug && <Td className="font-mono text-neutral-700">{item.slug}</Td>}
                  <Td>
                    {editing?.id !== item.id && (
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setEditing(item)} className="btn btn-secondary btn-sm">Rename</button>
                        <button type="button" disabled={busy} onClick={() => remove(item)} className="btn btn-ghost btn-sm">Delete</button>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
            {items.length === 0 && <p className="type-body-md mt-space-md text-neutral-700">Nothing matches.</p>}
          </>
        )}
      </LoadState>
    </>
  );
}
