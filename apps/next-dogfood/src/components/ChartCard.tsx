export function ChartCard() {
  return (
    <div
      data-nuvio-id="chart.sales"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h3
        data-nuvio-id="chart.sales.title"
        className="text-lg font-semibold text-gray-800 xl:text-base xl:font-medium xl:text-green-600"
      >
        Sales overview
      </h3>
      <p
        data-nuvio-id="chart.sales.subtitle"
        className="mt-1 text-sm text-gray-500"
      >
        Last 30 days
      </p>
      <div className="mt-6 flex h-32 items-end gap-2">
        {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-purple-200"
            style={{
              height: `${h}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
