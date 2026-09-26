"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TABS = [
  { id: "RENT", label: "Rent" },
  { id: "SELL", label: "Buy" },
];

// A plain GET form to /ads, so search works even before JavaScript loads.
// The tab only decides the `type` filter that is submitted with it.
export default function SearchPanel({ cities, categories, popular }) {
  const [type, setType] = useState("RENT");

  return (
    <form action="/ads" method="get" role="search" aria-label="Search listings" className="rounded-card-lg border border-neutral-200 bg-white p-space-md shadow-hover md:p-space-lg">
      <input type="hidden" name="type" value={type} />

      <div role="tablist" aria-label="Listing type" className="segmented">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={type === tab.id} className="segmented-item" onClick={() => setType(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="search-bar mt-space-md">
        <div className="search-bar-field md:flex-2">
          <label htmlFor="home-q">What do you need?</label>
          <input id="home-q" name="q" type="search" placeholder="Excavator, forklift, scaffolding" autoComplete="off" />
        </div>
        <div className="search-bar-field">
          <label htmlFor="home-city">Emirate</label>
          <select id="home-city" name="city" defaultValue="">
            <option value="">All emirates</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        <div className="search-bar-field">
          <label htmlFor="home-category">Category</label>
          <select id="home-category" name="category" defaultValue="">
            <option value="">All categories</option>
            {categories.map((main) => (
              <optgroup key={main.id} label={main.title}>
                <option value={main.slug}>All in {main.title}</option>
                {main.children.map((child) => (
                  <option key={child.id} value={child.slug}>
                    {child.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary md:px-8">
          <Search aria-hidden="true" />
          Search
        </button>
      </div>

      {/* {popular.length > 0 && (
        <div className="mt-space-md flex flex-wrap items-center gap-2">
          <span className="type-label-mono-md text-neutral-700">Popular:</span>
          {popular.map((category) => (
            <Link key={category.id} href={`/ads?category=${category.slug}`} className="pill transition-colors hover:border-amber-deep hover:bg-canvas">
              {category.title}
            </Link>
          ))}
        </div>
      )} */}
    </form>
  );
}
