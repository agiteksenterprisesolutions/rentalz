import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCategoryTree, getSeoSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata(await getSeoSettings(), "categories", {
    path: "/categories",
    title: "All categories: equipment and vehicles | TheRentalz",
    description: "Browse every equipment and vehicle category on TheRentalz: earth moving, aerial platforms, forklifts, power, concrete, trailers and more.",
  });
}

export default async function CategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div className="container-page py-space-xl">
      <nav aria-label="Breadcrumb" className="type-label-mono-md text-neutral-700">
        <Link href="/" className="hover:text-neutral-900">Home</Link> / <span aria-current="page">Categories</span>
      </nav>
      <header className="mb-space-xl mt-space-md max-w-2xl">
        <h1 className="type-headline-lg">All categories</h1>
        <p className="type-body-lg mt-space-sm text-neutral-700">Find the right machine or vehicle by category, then narrow down by emirate, make and price.</p>
      </header>

      <div className="grid gap-space-md md:grid-cols-2 xl:grid-cols-3">
        {tree.map((main) => (
          <section key={main.id} aria-labelledby={`cat-${main.id}`} className="card flex flex-col gap-space-md p-space-lg">
            <h2 id={`cat-${main.id}`} className="type-headline-sm">
              <Link href={`/categories/${main.slug}`} className="group flex items-center justify-between gap-2 hover:underline">
                {main.title}
                <ArrowRight aria-hidden="true" className="size-4 text-neutral-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </h2>
            <ul className="flex flex-col gap-2 border-t border-neutral-200 pt-space-md">
              {main.children.map((sub) => (
                <li key={sub.id}>
                  <Link href={`/categories/${sub.slug}`} className="type-body-md text-neutral-700 hover:text-neutral-900 hover:underline">{sub.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
