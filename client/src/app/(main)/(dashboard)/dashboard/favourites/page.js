import Favourites from "@/components/dashboard/Favourites";

export const metadata = { title: "Favourites" };

export default async function Page({ searchParams }) {
  const { page } = await searchParams;
  return <Favourites page={Math.max(1, Number.parseInt(Array.isArray(page) ? page[0] : page, 10) || 1)} />;
}
