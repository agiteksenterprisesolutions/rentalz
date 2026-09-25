import EditAd from "@/components/dashboard/EditAd";
import { PageHeading } from "@/components/dashboard/parts";
import { getCategoryTree, getCities, getMakes } from "@/lib/data";

export const metadata = { title: "Edit ad" };

export default async function EditAdPage({ params }) {
  const { slug } = await params;
  const [categories, cities, makes] = await Promise.all([getCategoryTree(), getCities(), getMakes()]);
  return (
    <>
      <PageHeading title="Edit ad" />
      <EditAd slug={slug} categories={categories} cities={cities} makes={makes} />
    </>
  );
}
