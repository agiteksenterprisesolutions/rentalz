"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/api/api";
import Notice from "@/components/auth/Notice";
import { apiError } from "@/hooks/useFetch";
import AdPhotos from "./AdPhotos";

const TYPES = [
  ["RENT", "For rent"],
  ["SELL", "For sale"],
  ["PREMIUM", "Premium"],
];
const OPERATORS = [
  ["", "Not specified"],
  ["WITH_OPERATOR", "With operator"],
  ["WITHOUT_OPERATOR", "Without operator"],
  ["BOTH", "Both options"],
];
const TRISTATE = [
  ["", "Not specified"],
  ["true", "Yes"],
  ["false", "No"],
];
const triValue = (v) => (v === true ? "true" : v === false ? "false" : "");

function Row({ label, htmlFor, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <fieldset className="card flex flex-col gap-space-md p-space-lg">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="type-headline-sm">{title}</h2>
        {hint && <p className="type-body-sm text-neutral-700">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

// Create (no `ad`) or edit (`ad` from GET /ads/:slug). Prices, categories and the review flow are all checked again by the API.
export default function AdForm({ ad, categories, cities, makes }) {
  const router = useRouter();
  const editing = Boolean(ad);
  const [main, setMain] = useState(ad?.mainCategoryId ?? "");
  const [sub, setSub] = useState(ad?.subCategoryId ?? "");
  const [leaf, setLeaf] = useState(ad?.leafCategoryId ?? "");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const mainNode = categories.find((c) => c.id === Number(main));
  const subNode = mainNode?.children?.find((c) => c.id === Number(sub));
  const types = editing && !TYPES.some(([v]) => v === ad.type) ? [...TYPES, [ad.type, ad.type]] : TYPES;

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    if (!main) return setError("Choose a category.");
    if (!["price", "dailyPrice", "weeklyPrice", "monthlyPrice"].some((k) => values[k])) return setError("Enter at least one price.");

    const body = { ...values, mainCategoryId: main, subCategoryId: sub, leafCategoryId: leaf };
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/ads/${ad.id}`, body);
      } else {
        const data = new FormData();
        Object.entries(body).forEach(([k, v]) => v !== "" && data.append(k, v));
        files.forEach((f) => data.append("photos", f));
        await api.post("/ads", data);
      }
      router.push("/dashboard/ads");
      router.refresh();
    } catch (e) {
      setError(apiError(e));
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const v = (key) => ad?.[key] ?? "";
  // The stored `price` is the lowest tier, computed by the API. Only show it as its own value when no tier is set.
  const hasTier = ["dailyPrice", "weeklyPrice", "monthlyPrice"].some((k) => Number(ad?.[k]) > 0);
  const priceDefault = (name) => (v(name) && !(name === "price" && hasTier) ? Number(v(name)) : "");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-lg">
      {error && <Notice>{error}</Notice>}
      {editing && ad.status !== "PENDING" && ad.status !== "DRAFT" && (
        <Notice tone="success">Saving changes sends this ad back for review, and it&apos;s hidden until it&apos;s approved again.</Notice>
      )}

      <Section title="Basics">
        <Row label="Listing type" htmlFor="type">
          <select id="type" name="type" defaultValue={ad?.type ?? "RENT"} className="select">
            {types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Row>
        <Row label="Title" htmlFor="title" hint="At least 5 characters. Say what it is and where.">
          <input id="title" name="title" required minLength={5} maxLength={255} defaultValue={v("title")} className="input" placeholder="e.g. 20-ton excavator with operator, Dubai" />
        </Row>
        <div className="grid gap-space-md sm:grid-cols-3">
          <Row label="Category" htmlFor="main">
            <select id="main" required value={main} onChange={(e) => { setMain(e.target.value); setSub(""); setLeaf(""); }} className="select">
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Row>
          <Row label="Sub-category" htmlFor="sub">
            <select id="sub" value={sub} disabled={!mainNode?.children?.length} onChange={(e) => { setSub(e.target.value); setLeaf(""); }} className="select">
              <option value="">Choose…</option>
              {mainNode?.children?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Row>
          <Row label="Type" htmlFor="leaf">
            <select id="leaf" value={leaf} disabled={!subNode?.children?.length} onChange={(e) => setLeaf(e.target.value)} className="select">
              <option value="">Choose…</option>
              {subNode?.children?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Row>
        </div>
        <Row label="Description" htmlFor="description">
          <textarea id="description" name="description" rows={6} maxLength={10000} defaultValue={v("description")} className="textarea" placeholder="Condition, what's included, minimum rental period…" />
        </Row>
      </Section>

      <Section title="Prices (AED)" hint="Enter at least one. For rentals, the daily, weekly and monthly rates are all shown to buyers.">
        <div className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {[["price", "Price"], ["dailyPrice", "Per day"], ["weeklyPrice", "Per week"], ["monthlyPrice", "Per month"]].map(([name, label]) => (
            <Row key={name} label={label} htmlFor={name}>
              <input id={name} name={name} type="number" min="1" step="0.01" inputMode="decimal" defaultValue={priceDefault(name)} className="input" />
            </Row>
          ))}
        </div>
      </Section>

      <Section title="Details">
        <div className="grid gap-space-md sm:grid-cols-2">
          <Row label="Make" htmlFor="makeId">
            <select id="makeId" name="makeId" defaultValue={v("makeId")} className="select">
              <option value="">Not specified</option>
              {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Row>
          <Row label="Model" htmlFor="model"><input id="model" name="model" maxLength={100} defaultValue={v("model")} className="input" /></Row>
          <Row label="Model year" htmlFor="modelYear"><input id="modelYear" name="modelYear" type="number" min="1950" max={new Date().getFullYear() + 1} defaultValue={v("modelYear")} className="input" /></Row>
          <Row label="Capacity" htmlFor="capacity"><input id="capacity" name="capacity" maxLength={100} defaultValue={v("capacity")} className="input" placeholder="e.g. 20 ton" /></Row>
          <Row label="Fuel" htmlFor="fuelType"><input id="fuelType" name="fuelType" maxLength={50} defaultValue={/^\d+$/.test(v("fuelType")) ? "" : v("fuelType")} className="input" placeholder="Diesel, petrol, electric…" /></Row>
          <Row label="Operator" htmlFor="operator">
            <select id="operator" name="operator" defaultValue={v("operator")} className="select">
              {OPERATORS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Row>
          {[["insurance", "Insurance included"], ["warranty", "Warranty"], ["transportation", "Transportation available"]].map(([name, label]) => (
            <Row key={name} label={label} htmlFor={name}>
              <select id={name} name={name} defaultValue={triValue(ad?.[name])} className="select">
                {TRISTATE.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </Row>
          ))}
        </div>
        <Row label="Your terms" htmlFor="terms" hint="Deposit, cancellation or delivery conditions.">
          <textarea id="terms" name="terms" rows={3} maxLength={5000} defaultValue={/^(yes|no)$/i.test(v("terms")) ? "" : v("terms")} className="textarea" />
        </Row>
      </Section>

      <Section title="Location and contact">
        <div className="grid gap-space-md sm:grid-cols-2">
          <Row label="Emirate" htmlFor="cityId">
            <select id="cityId" name="cityId" required defaultValue={v("cityId")} className="select">
              <option value="">Choose…</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Row>
          <Row label="Address or area" htmlFor="address"><input id="address" name="address" maxLength={255} defaultValue={v("address")} className="input" /></Row>
          <Row label="Phone number" htmlFor="phone" hint="Shown to buyers. Used for calls and WhatsApp.">
            <input id="phone" name="phone" type="tel" required pattern="\+?[0-9\s\-]{6,20}" title="Digits, spaces and dashes, 6 to 20 characters" defaultValue={v("phone")} className="input" placeholder="+971 50 123 4567" />
          </Row>
        </div>
      </Section>

      <Section title="Photos">
        {editing ? <AdPhotos adId={ad.id} initial={ad.photos ?? []} /> : <AdPhotos files={files} onFiles={setFiles} />}
      </Section>

      <div className="flex flex-wrap gap-space-sm">
        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? "Saving…" : editing ? "Save changes" : "Submit for review"}</button>
        <Link href="/dashboard/ads" className="btn btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
