import { Handshake, MapPinned, ShieldCheck } from "lucide-react";

const POINTS = [
  { icon: MapPinned, text: "Listings in every emirate, from Abu Dhabi to Fujairah" },
  { icon: ShieldCheck, text: "Every ad is reviewed before it goes live" },
  { icon: Handshake, text: "Call or WhatsApp the owner directly. No middlemen" },
];

// Decorative scene for the sign-in and register pages: a crane, a skyline and an excavator in the brand colours.
function Scene() {
  const windows = [];
  for (const [x, top, cols, rows] of [[380, 150, 3, 6], [440, 110, 3, 8], [500, 170, 2, 5], [40, 200, 3, 4]]) {
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) windows.push(<rect key={`${x}-${c}-${r}`} x={x + 8 + c * 16} y={top + 10 + r * 20} width="8" height="10" rx="1" fill="#fbb817" opacity={(c + r) % 3 === 0 ? 0.55 : 0.18} />);
  }
  return (
    <svg viewBox="0 0 600 380" role="img" aria-label="An excavator working beside a crane and city buildings" preserveAspectRatio="xMidYMax meet" className="h-full max-h-full w-full">
      <circle cx="470" cy="70" r="38" fill="#fbb817" opacity="0.16" />
      <circle cx="470" cy="70" r="20" fill="#fbb817" opacity="0.5" />
      {/* skyline */}
      <rect x="380" y="150" width="60" height="180" fill="#2a271e" />
      <rect x="440" y="110" width="60" height="220" fill="#332f25" />
      <rect x="500" y="170" width="44" height="160" fill="#2a271e" />
      <rect x="40" y="200" width="60" height="130" fill="#2a271e" />
      {windows}
      {/* tower crane */}
      <rect x="150" y="60" width="10" height="270" fill="#4a463d" />
      {[90, 130, 170, 210, 250, 290].map((y) => <path key={y} d={`M150 ${y} L160 ${y + 40} M160 ${y} L150 ${y + 40}`} stroke="#3a362b" strokeWidth="2" />)}
      <rect x="60" y="56" width="230" height="8" fill="#fbb817" />
      <rect x="100" y="64" width="6" height="14" fill="#d99b08" />
      <path d="M140 56 L155 30 L170 56 Z" fill="#d99b08" />
      <rect x="120" y="44" width="34" height="12" fill="#d99b08" />
      <line x1="262" y1="64" x2="262" y2="150" stroke="#9c988f" strokeWidth="2" />
      <rect x="252" y="150" width="20" height="14" rx="2" fill="#fbb817" />
      {/* ground */}
      <rect x="0" y="330" width="600" height="50" fill="#1e1c15" />
      <rect x="0" y="330" width="600" height="4" fill="#fbb817" opacity="0.6" />
      <path d="M0 348 h600" stroke="#2f2b22" strokeWidth="2" strokeDasharray="14 12" />
      {/* excavator */}
      <g>
        <rect x="222" y="304" width="150" height="26" rx="13" fill="#0f0e0a" stroke="#4a463d" strokeWidth="2" />
        {[240, 265, 290, 315, 340, 355].map((cx) => <circle key={cx} cx={cx} cy="317" r="7" fill="#2f2b22" />)}
        <polygon points="238,304 238,262 322,262 346,284 346,304" fill="#fbb817" />
        <rect x="226" y="270" width="20" height="34" rx="3" fill="#d99b08" />
        <polygon points="252,262 252,232 300,232 324,262" fill="#fbb817" />
        <polygon points="260,258 260,240 296,240 312,258" fill="#3a362b" />
        <polygon points="266,256 266,244 282,244 282,256" fill="#9c988f" opacity="0.35" />
        <polyline points="330,272 414,206" fill="none" stroke="#fbb817" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="414,206 462,282" fill="none" stroke="#d99b08" strokeWidth="11" strokeLinecap="round" />
        <polygon points="456,280 494,276 500,312 460,318" fill="#fbb817" />
        <polygon points="494,276 500,312 508,306 504,278" fill="#d99b08" />
        <circle cx="414" cy="206" r="7" fill="#17150f" />
        <circle cx="330" cy="272" r="7" fill="#17150f" />
        <circle cx="462" cy="282" r="5" fill="#17150f" />
      </g>
    </svg>
  );
}

export default function AuthShowcase() {
  return (
    <aside aria-label="About TheRentalz" className="on-dark relative hidden overflow-hidden bg-charcoal text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:self-start lg:p-space-2xl">
      <div className="relative z-10 max-w-lg">
        <p className="eyebrow text-amber">Equipment and vehicles, UAE</p>
        <h2 className="type-display-xl mt-space-md uppercase">Put your equipment to work</h2>
        <ul className="mt-space-lg flex flex-col gap-space-md">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="type-body-lg flex items-start gap-3 text-white/80">
              <Icon aria-hidden="true" className="mt-1 size-5 shrink-0 text-amber" />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative z-10 mt-space-md flex min-h-0 flex-1 items-end">
        <Scene />
      </div>
    </aside>
  );
}
