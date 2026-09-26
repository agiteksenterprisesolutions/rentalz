import HeroShowcase from "./HeroShowcase";
import SearchPanel from "./SearchPanel";

// `slides` are the machine categories from getHeroSlides(). On large screens the hero fills the first screen below the
// header, with the search panel at its foot and clear of it, so both are visible without scrolling. As the screen gets
// shorter the headline shrinks, then the decorative squares go (under 900px tall), then the standfirst (under 680px).
export default function Hero({ slides, cities, categories, popular }) {
  const intro = (
    <>
      <p className="type-label-mono-md flex items-center gap-3 tracking-[0.16em] text-amber-ink uppercase">
        <span aria-hidden="true" className="h-0.5 w-10 bg-amber" />
        UAE equipment and vehicle marketplace
      </p>
      <h1 id="hero-title" className="type-display-xl max-w-4xl xl:text-[clamp(2.25rem,7.6vh,4.5rem)] xl:leading-[1.06]">
        Rent &amp; buy equipment and vehicles across the UAE
      </h1>
      <p className="type-body-lg max-w-xl text-neutral-700 [@media(max-height:680px)]:xl:hidden">
        Browse listings from owners in every emirate. Compare daily, weekly and monthly rates, then contact the seller directly.
      </p>
      <div aria-hidden="true" className="flex gap-3 [@media(max-height:900px)]:xl:hidden">
        {[0, 1, 2].map((i) => <span key={i} className="size-3.5 bg-amber" />)}
      </div>
    </>
  );

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden xl:flex xl:min-h-[calc(100dvh-4.5rem)] xl:flex-col">
      {/* slanted panel at the very back; the machine photo, a wash and the text stack above it */}
      <div aria-hidden="true" className="absolute inset-0 -z-30 hidden bg-surface-container-low [clip-path:polygon(46%_0,100%_0,100%_100%,72%_100%)] xl:block" />
      <HeroShowcase slides={slides} intro={intro} />

      {/* The search panel sits at the hero's foot with its own breathing room above it. */}
      <div className="container-page relative z-10 pb-space-xl pt-space-lg xl:pb-space-2xl">
        <SearchPanel cities={cities} categories={categories} popular={popular} />
      </div>
    </section>
  );
}
