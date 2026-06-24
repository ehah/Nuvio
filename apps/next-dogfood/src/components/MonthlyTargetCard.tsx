export function MonthlyTargetCard() {
  return (
    <div
      data-nuvio-id="target.monthly.card"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h3
        data-nuvio-id="target.monthly.title"
        className="text-lg font-semibold text-gray-800 xl:text-base xl:font-medium xl:text-purple-600"
      >
        Monthly target
      </h3>
      <p
        data-nuvio-id="target.monthly.subtitle"
        className="mt-2 text-sm text-gray-600"
      >
        You have reached 78% of your monthly sales goal.
      </p>
      <p
        data-nuvio-id="target.monthly.value"
        className="mt-4 text-3xl font-semibold text-gray-900"
      >
        $45,231
      </p>
    </div>
  );
}
