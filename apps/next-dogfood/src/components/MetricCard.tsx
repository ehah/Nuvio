export function CustomersMetricCard() {
  return (
    <div
      data-nuvio-id="metric.customers.card"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <p
        data-nuvio-id="metric.customers.label"
        className="text-sm font-medium text-gray-500"
      >
        Customers
      </p>
      <p
        data-nuvio-id="metric.customers.value"
        className="mt-2 text-3xl font-semibold text-gray-900"
      >
        3,456
      </p>
    </div>
  );
}

export function OrdersMetricCard() {
  return (
    <div
      data-nuvio-id="metric.orders.card"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <p
        data-nuvio-id="metric.orders.label"
        className="text-sm font-medium text-gray-500"
      >
        Orders
      </p>
      <p
        data-nuvio-id="metric.orders.value"
        className="mt-2 text-3xl font-semibold text-gray-900"
      >
        3,782
      </p>
    </div>
  );
}
