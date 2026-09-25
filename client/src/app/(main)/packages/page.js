import PlansExplorer from "@/components/shop/PlansExplorer";
import { FeaturedBoost, PlansCta, PlansFaq, PlansHero } from "@/components/shop/PlansSections";
import { summarise } from "@/components/shop/plansData";
import { getPackages, getSeoSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata(await getSeoSettings(), "packages", {
    path: "/packages",
    title: "Plans and pricing | TheRentalz",
    description: "Compare TheRentalz plans: single ads and business tiers, with optional featured placement, for publishing equipment and vehicle listings in the UAE.",
  });
}

export default async function PackagesPage() {
  const groups = (await getPackages()).filter((g) => g.packages.length);

  return (
    <div className="container-page flex flex-col gap-space-2xl py-space-xl">
      {groups.length === 0 ? (
        <p className="type-body-md text-neutral-700">Plans are not available right now. Please check back soon.</p>
      ) : (
        <>
          <PlansHero summary={summarise(groups)} />
          <PlansExplorer groups={groups} />
          <FeaturedBoost summary={summarise(groups)} />
        </>
      )}
      <PlansCta />
      <PlansFaq />
    </div>
  );
}
