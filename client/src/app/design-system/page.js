import { ArrowRight, Search } from "lucide-react";

export const metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const colorGroups = [
  {
    name: "Brand",
    swatches: [
      ["bg-canvas", "canvas", "#FBFAF8"],
      ["bg-charcoal", "charcoal", "#17150F"],
      ["bg-amber", "amber", "#FBB817"],
      ["bg-amber-deep", "amber-deep", "#D99B08"],
      ["bg-amber-ink", "amber-ink", "#926300"],
    ],
  },
  {
    name: "Neutrals",
    swatches: [
      ["bg-neutral-50", "neutral-50", "#FFFFFF"],
      ["bg-neutral-200", "neutral-200", "#E9E6DF"],
      ["bg-neutral-400", "neutral-400", "#9C988F"],
      ["bg-neutral-700", "neutral-700", "#4A463D"],
      ["bg-neutral-900", "neutral-900", "#17150F"],
    ],
  },
  {
    name: "Semantic",
    swatches: [
      ["bg-surface", "surface", "#FCF9F2"],
      ["bg-surface-container", "surface-container", "#F1EEE6"],
      ["bg-primary", "primary", "#7C5800"],
      ["bg-primary-container", "primary-container", "#FBB817"],
      ["bg-secondary", "secondary", "#625E56"],
      ["bg-error", "error", "#BA1A1A"],
    ],
  },
];

const typeRoles = [
  ["type-display-xl", "Display XL", "Move heavy things"],
  ["type-headline-lg", "Headline LG", "Fleet ready for the site"],
  ["type-headline-md", "Headline MD", "Man Lift in Abu Dhabi"],
  ["type-headline-sm", "Headline SM", "Daily, weekly and monthly rates"],
  ["type-body-lg", "Body LG", "Excavators, lifts, trailers and scaffolding from owners across the UAE."],
  ["type-body-md", "Body MD", "Call or message the seller directly to agree dates, price and delivery."],
  ["type-body-sm", "Body SM", "Prices exclude transport unless the listing says otherwise."],
  ["type-label-mono-lg", "Label mono LG", "AED 500 / day"],
  ["type-label-mono-md", "Label mono MD", "Max reach 42 m"],
  ["type-label-mono-sm", "Label mono SM", "Verified tier 1"],
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="section border-t border-neutral-200 first:border-t-0">
      <h2 className="type-headline-md mb-space-lg">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="container-page py-space-xl">
      <p className="eyebrow">Industrial Luxe</p>
      <h1 className="type-display-xl mt-space-sm">Design system</h1>
      <p className="type-body-lg mt-space-md max-w-2xl text-neutral-700">
        Every token and component class used across TheRentalz. Tokens live in <code className="font-mono text-sm">src/styles/tokens.css</code>,
        components in <code className="font-mono text-sm">src/styles/components.css</code>.
      </p>

      <Section id="colors" title="Colour">
        <div className="flex flex-col gap-space-lg">
          {colorGroups.map((group) => (
            <div key={group.name}>
              <p className="type-label-mono-md mb-space-sm text-neutral-700">{group.name}</p>
              <div className="grid grid-cols-2 gap-space-md md:grid-cols-3 xl:grid-cols-6">
                {group.swatches.map(([cls, name, hex]) => (
                  <div key={name} className="card p-space-sm">
                    <div className={`${cls} h-16 rounded-xl border border-neutral-200`} />
                    <p className="mt-space-sm text-sm font-semibold">{name}</p>
                    <p className="type-label-mono-md text-neutral-700">{hex}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Typography">
        <div className="flex flex-col divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {typeRoles.map(([cls, label, sample]) => (
            <div key={cls} className="grid gap-space-sm px-space-lg py-space-md md:grid-cols-[14rem_1fr] md:items-baseline">
              <p className="type-label-mono-md text-neutral-700">{label}<br /><span className="text-neutral-400">{cls}</span></p>
              <p className={cls}>{sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="flex flex-wrap items-center gap-space-md">
          <button className="btn btn-primary">Post an ad <ArrowRight /></button>
          <button className="btn btn-secondary">Contact seller</button>
          <button className="btn btn-ghost">Save search</button>
          <button className="btn btn-danger">Delete ad</button>
          <button className="btn btn-primary" disabled>Disabled</button>
          <button className="btn btn-primary btn-sm">Small</button>
          <button className="btn btn-primary btn-lg">Large</button>
          <button className="btn btn-secondary btn-icon" aria-label="Search"><Search /></button>
        </div>
        <div className="on-dark mt-space-lg flex flex-wrap items-center gap-space-md rounded-3xl bg-charcoal p-space-lg">
          <button className="btn btn-primary">Book now</button>
          <button className="btn btn-ghost-inverse">View details</button>
        </div>
        <p className="type-body-sm mt-space-md text-neutral-700">
          Hover, press with the mouse, or Tab to a button to see its hover, active and focus states.{" "}
          <a href="#buttons" className="link">Inline link</a>
        </p>
      </Section>

      <Section id="badges" title="Badges and pills">
        <div className="flex flex-wrap items-center gap-space-sm">
          <span className="pill pill-available pill-dot">Available now</span>
          <span className="pill pill-available">Operator included</span>
          <span className="pill">Dry lease</span>
          <span className="pill">Wet lease</span>
          <span className="pill pill-dark">Verified tier 1</span>
          <span className="pill pill-danger">Rejected</span>
          <span className="pill pill-sm">Small</span>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <div className="grid gap-gutter md:grid-cols-2">
          <article className="card card-interactive flex flex-col gap-space-md">
            <div className="card-media" />
            <div className="flex items-center gap-space-sm">
              <span className="pill pill-available pill-dot">Available now</span>
              <span className="pill">For rent</span>
            </div>
            <h3 className="type-headline-sm">Man Lift in Abu Dhabi</h3>
            <div className="spec-strip">
              <span>Max reach 42 m</span>
              <span>50 ton</span>
              <span>CAT C13</span>
            </div>
            <div className="divider" />
            <div className="flex items-end justify-between">
              <div className="price"><span className="price-amount">AED 500</span><span className="price-unit">/ day</span></div>
              <button className="btn btn-primary btn-sm">Details</button>
            </div>
          </article>

          <article className="card-dark card-interactive flex flex-col gap-space-md">
            <p className="eyebrow">Dubai Industrial City</p>
            <h3 className="type-headline-md">Enterprise fleet</h3>
            <p className="type-body-md text-white/70">Dark cards carry high-tier equipment and telematics.</p>
            <div className="price"><span className="price-amount">AED 9,998</span><span className="price-unit">/ month</span></div>
            <button className="btn btn-primary self-start">Instant booking</button>
          </article>
        </div>
      </Section>

      <Section id="forms" title="Form controls">
        <form className="grid max-w-3xl gap-gutter md:grid-cols-2" onSubmit={undefined}>
          <div>
            <label className="label" htmlFor="ds-title">Title</label>
            <input id="ds-title" className="input" placeholder="Excavator, forklift, scaffolding" />
            <span className="field-hint">Up to 255 characters</span>
          </div>
          <div>
            <label className="label" htmlFor="ds-city">Emirate</label>
            <select id="ds-city" className="select" defaultValue="Dubai">
              <option>Abu Dhabi</option>
              <option>Dubai</option>
              <option>Sharjah</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ds-price">Daily price</label>
            <div className="input-group">
              <input id="ds-price" className="input" inputMode="decimal" defaultValue="500" />
              <span className="input-affix">AED / day</span>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="ds-error">Phone (invalid)</label>
            <input id="ds-error" className="input" aria-invalid="true" aria-describedby="ds-error-msg" defaultValue="abc" />
            <span id="ds-error-msg" className="field-error">Enter a valid phone number.</span>
          </div>
          <div>
            <label className="label" htmlFor="ds-disabled">Disabled</label>
            <input id="ds-disabled" className="input" disabled defaultValue="Locked" />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="ds-desc">Description</label>
            <textarea id="ds-desc" className="textarea" placeholder="Condition, service history, what is included" />
          </div>
          <fieldset className="flex flex-col gap-space-sm">
            <legend className="label">Options</legend>
            <label className="check-row"><input type="checkbox" className="checkbox" defaultChecked /> Operator included</label>
            <label className="check-row"><input type="checkbox" className="checkbox" /> Insurance included</label>
            <label className="check-row"><input type="checkbox" className="checkbox" disabled /> Warranty (unavailable)</label>
          </fieldset>
          <fieldset className="flex flex-col gap-space-sm">
            <legend className="label">Listing type</legend>
            <label className="check-row"><input type="radio" name="ds-type" className="radio" defaultChecked /> Rent</label>
            <label className="check-row"><input type="radio" name="ds-type" className="radio" /> Sell</label>
          </fieldset>
        </form>
      </Section>

      <Section id="search" title="Segmented control and search bar">
        <div role="tablist" aria-label="Listing type" className="segmented">
          <button role="tab" aria-selected="true" className="segmented-item">Rent</button>
          <button role="tab" aria-selected="false" className="segmented-item">Buy</button>
          <button role="tab" aria-selected="false" className="segmented-item">Premium</button>
        </div>
        <div className="search-bar mt-space-lg">
          <div className="search-bar-field">
            <label htmlFor="ds-sq">Equipment</label>
            <input id="ds-sq" placeholder="Excavator, forklift, scaffolding" />
          </div>
          <div className="search-bar-field">
            <label htmlFor="ds-sc">Emirate</label>
            <select id="ds-sc" defaultValue="">
              <option value="">All emirates</option>
              <option>Dubai</option>
              <option>Abu Dhabi</option>
            </select>
          </div>
          <button className="btn btn-primary md:px-8"><Search /> Search</button>
        </div>
      </Section>

      <Section id="specs" title="Spec sheet">
        <div className="spec-table max-w-xl">
          <div className="spec-row"><span className="spec-key">Make</span><span className="spec-value">Komatsu</span></div>
          <div className="spec-row"><span className="spec-key">Model year</span><span className="spec-value">2020</span></div>
          <div className="spec-row"><span className="spec-key">Operator</span><span className="spec-value">With operator</span></div>
          <div className="spec-row"><span className="spec-key">Daily rate</span><span className="spec-value">AED 500</span></div>
          <div className="spec-row"><span className="spec-key">Monthly rate</span><span className="spec-value">AED 9,998</span></div>
        </div>
      </Section>

      <Section id="elevation" title="Elevation">
        <div className="grid gap-gutter md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-space-lg shadow-resting">
            <p className="type-label-mono-md">shadow-resting</p>
          </div>
          <div className="rounded-2xl border border-amber-deep bg-white p-space-lg shadow-hover">
            <p className="type-label-mono-md">shadow-hover</p>
          </div>
          <div className="panel-floating p-space-lg">
            <p className="type-label-mono-md">panel-floating</p>
          </div>
        </div>
      </Section>
    </main>
  );
}
