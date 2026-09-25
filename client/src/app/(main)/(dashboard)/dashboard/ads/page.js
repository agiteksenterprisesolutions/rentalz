import MyAds from "@/components/dashboard/MyAds";

export const metadata = { title: "My ads" };

export default async function MyAdsPage({ searchParams }) {
  const { status, page } = await searchParams;
  const one = (v) => (Array.isArray(v) ? v[0] : v);
  return <MyAds status={one(status) ?? ""} page={Math.max(1, Number.parseInt(one(page), 10) || 1)} />;
}
