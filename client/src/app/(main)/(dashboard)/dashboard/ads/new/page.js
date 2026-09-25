import AdForm from "@/components/dashboard/AdForm";
import { PageHeading } from "@/components/dashboard/parts";
import { getCategoryTree, getCities, getMakes } from "@/lib/data";

export const metadata = { title: "Post an ad" };

export default async function NewAdPage() {
  const [categories, cities, makes] = await Promise.all([getCategoryTree(), getCities(), getMakes()]);
  return (
    <>
      <PageHeading title="Post an ad" subtitle="We review every ad before it goes live, usually within a day." />
      <AdForm categories={categories} cities={cities} makes={makes} />
    </>
  );
}
