import Skeleton from "@/components/ui/Skeleton";
import Spinner from "@/components/ui/Spinner";

// Search results: a filter column and a grid of cards, so a filter change doesn't blank the page.
export default function Loading() {
  return (
    <div className="container-page py-space-xl">
      <Spinner label="Loading listings…" className="sr-only" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-space-md h-12 w-64" />
      <div className="mt-space-lg grid gap-space-lg lg:grid-cols-[18rem_1fr]">
        <Skeleton className="hidden h-[32rem] lg:block" />
        <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    </div>
  );
}
