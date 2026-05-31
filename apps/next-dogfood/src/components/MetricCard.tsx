type MetricCardProps = {
  variant?: "customers" | "orders";
};

export function MetricCard({ variant = "customers" }: MetricCardProps) {
  const host = variant === "orders" ? "metric.orders" : "metric.customers";
  const label = variant === "orders" ? "Orders" : "Customers";
  const value = variant === "orders" ? "3,782" : "3,456";

  return (
    <div
      data-nuvio-id={`${host}.card`}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <p
        data-nuvio-id={`${host}.label`}
        className="text-sm font-medium text-gray-500"
      >
        {label}
      </p>
      <p
        data-nuvio-id={`${host}.value`}
        className="mt-2 text-3xl font-semibold text-gray-900"
      >
        {value}
      </p>
    </div>
  );
}
