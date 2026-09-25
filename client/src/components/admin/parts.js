"use client";

import { useState } from "react";
import { api } from "@/api/api";
import { apiError } from "@/hooks/useFetch";

export const dateTime = (iso) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const dateOnly = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function Table({ label, columns, children }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[42rem] text-left">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-b border-neutral-200">
            {columns.map((c, i) => (
              <th key={i} scope="col" className="type-label-mono-md whitespace-nowrap px-space-md py-space-sm font-normal text-neutral-700 uppercase">{c || <span className="sr-only">Actions</span>}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className = "" }) => <td className={`type-body-sm px-space-md py-space-sm align-top ${className}`}>{children}</td>;

// Filter bar: a plain GET form so filters live in the URL. `fields` = [{ name, label, type, options?, placeholder? }]
export function Filters({ action, values, fields }) {
  return (
    <form action={action} method="get" className="mb-space-md flex flex-wrap items-end gap-space-sm">
      {fields.map((f) => (
        <div key={f.name} className="min-w-40 flex-1">
          <label htmlFor={`f-${f.name}`} className="label">{f.label}</label>
          {f.options ? (
            <select id={`f-${f.name}`} name={f.name} defaultValue={values[f.name] ?? ""} className="select">
              <option value="">All</option>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ) : (
            <input id={`f-${f.name}`} name={f.name} type="search" defaultValue={values[f.name] ?? ""} placeholder={f.placeholder} className="input" />
          )}
        </div>
      ))}
      <button type="submit" className="btn btn-primary">Filter</button>
    </form>
  );
}

// Runs an admin call and tracks its outcome so a row can show "working" and an error.
export function useRun() {
  const [state, setState] = useState({ busy: false, error: null });
  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      const result = await fn();
      setState({ busy: false, error: null });
      return { ok: true, result };
    } catch (e) {
      setState({ busy: false, error: apiError(e) });
      return { ok: false };
    }
  };
  return { ...state, run };
}

export { api };
