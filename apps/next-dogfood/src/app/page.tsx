import { ChartCard } from "@/components/ChartCard";
import { DemoCard } from "@/components/DemoCard";
import { CustomersMetricCard, OrdersMetricCard } from "@/components/MetricCard";
import { MonthlyTargetCard } from "@/components/MonthlyTargetCard";
import { RecentOrders } from "@/components/RecentOrders";
export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1
        data-nuvio-id="dashboard.title"
        className="text-2xl font-semibold text-gray-900 xl:text-base xl:font-medium xl:text-purple-600"
      >
        Next.js dogfood dashboard
      </h1>
      <p className="text-sm text-gray-600">
        Untagged line for click-to-tag: edit this subtitle in dev.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <CustomersMetricCard />
        <OrdersMetricCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DemoCard />
        <MonthlyTargetCard />
        <ChartCard />
      </div>

      <RecentOrders />
    </main>
  );
}
