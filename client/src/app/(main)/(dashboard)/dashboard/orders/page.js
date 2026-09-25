import Orders from "@/components/dashboard/Orders";

export const metadata = { title: "Orders" };

export default async function Page({ searchParams }) {
  const { page } = await searchParams;
  return <Orders page={Math.max(1, Number.parseInt(Array.isArray(page) ? page[0] : page, 10) || 1)} />;
}
