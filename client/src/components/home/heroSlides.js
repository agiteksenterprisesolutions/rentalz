// Machines shown in the home hero. Each is a cut-out photo (public/hero) tied to a category, so the slide's
// title comes from the live catalogue. Slides for categories with no listings yet are skipped (see getHeroSlides).
export const HERO_CANDIDATES = [
  { slug: "earth-moving", image: "/hero/excavator.webp", alt: "Yellow crawler excavator" },
  { slug: "backhoes", image: "/hero/backhoe.webp", alt: "Yellow backhoe loader" },
  { slug: "bulldozers", image: "/hero/bulldozer.webp", alt: "Yellow bulldozer" },
  { slug: "motor-grader", image: "/hero/grader.webp", alt: "Motor grader" },
  { slug: "bobcat", image: "/hero/skid-steer.webp", alt: "Compact skid steer loader" },
  { slug: "vehicle-and-trailers", image: "/hero/truck.webp", alt: "Yellow tipper truck" },
];
export const MAX_HERO_SLIDES = 5;
