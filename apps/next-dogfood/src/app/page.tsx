import { MetricCard } from "@/components/MetricCard";
import { RecentOrders } from "@/components/RecentOrders";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1
        data-nuvio-id="page.title"
        className="text-2xl font-semibold text-gray-900"
      >
        Next.js dogfood dashboard
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard />
        <MetricCard variant="orders" />
      </div>
      <RecentOrders />
    </main>
  );
}
