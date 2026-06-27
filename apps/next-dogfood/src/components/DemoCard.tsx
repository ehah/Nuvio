export function DemoCard() {
  return (
    <div
      data-nuvio-id="demo.card"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h3
        data-nuvio-id="demo.title"
        className="text-lg font-semibold text-gray-800 xl:text-base xl:font-medium xl:text-green-600"
      >
        Product overview
      </h3>
      <p data-nuvio-id="demo.subtitle" className="mt-2 text-sm text-gray-600">
        Track performance across channels and regions for this quarter.
      </p>
    </div>
  );
}
