import { Search } from "lucide-react";
import Link from "next/link";
import FilterPanel from "./FilterPanel";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "featured", label: "Featured first" },
  { value: "oldest", label: "Oldest first" },
];

const TYPES = [
  { value: "", label: "All" },
  { value: "RENT", label: "Rent" },
  { value: "SELL", label: "Buy" },
  { value: "PREMIUM", label: "Premium" },
];

// A plain GET form back to /ads: filters live in the URL, so results can be shared, bookmarked and saved as a search.
// On small screens the form sits behind a native <details> toggle, which needs no JavaScript.
export default function AdFilters({ values, cities, categories, makes, activeCount }) {
  return (
    <FilterPanel activeCount={activeCount}>
      <form action="/ads" method="get" className="flex flex-col gap-space-md px-space-md pb-space-md">
        <div>
          <label htmlFor="f-q" className="label">Keyword</label>
          <input id="f-q" name="q" type="search" defaultValue={values.q} placeholder="Excavator, forklift…" className="input" />
        </div>

        <fieldset>
          <legend className="label">Listing type</legend>
          <div className="segmented mt-1 flex w-full [&>label]:flex-1 [&>label]:justify-center [&>label]:px-2">
            {TYPES.map((t) => (
              <label key={t.value} className="segmented-item cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-resting">
                <input type="radio" name="type" value={t.value} defaultChecked={(values.type ?? "") === t.value} className="sr-only" />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="f-category" className="label">Category</label>
          <select id="f-category" name="category" defaultValue={values.category ?? ""} className="select">
            <option value="">All categories</option>
            {categories.map((main) => (
              <optgroup key={main.id} label={main.title}>
                <option value={main.slug}>All in {main.title}</option>
                {main.children.map((child) => (
                  <option key={child.id} value={child.slug}>{child.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-city" className="label">Emirate</label>
          <select id="f-city" name="city" defaultValue={values.city ?? ""} className="select">
            <option value="">All emirates</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-make" className="label">Make</label>
          <select id="f-make" name="make" defaultValue={values.make ?? ""} className="select">
            <option value="">All makes</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="label">Price (AED)</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input name="minPrice" type="number" min="0" inputMode="numeric" defaultValue={values.minPrice} placeholder="Min" aria-label="Minimum price" className="input" />
            <input name="maxPrice" type="number" min="0" inputMode="numeric" defaultValue={values.maxPrice} placeholder="Max" aria-label="Maximum price" className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="f-sort" className="label">Sort by</label>
          <select id="f-sort" name="sort" defaultValue={values.sort ?? "newest"} className="select">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1">
            <Search aria-hidden="true" />
            Apply
          </button>
          {activeCount > 0 && (
            <Link href="/ads" className="btn btn-secondary">Clear</Link>
          )}
        </div>
      </form>
    </FilterPanel>
  );
}
