export function BadgeShowcase() {
  return (
    <div
      data-nuvio-id="badges.light.card"
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-gray-800">Light badges</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        <span
          data-nuvio-id="badges.demo.primary"
          className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
        >
          Primary
        </span>
        <span
          data-nuvio-id="badges.demo.success"
          className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
        >
          Success
        </span>
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Warning
        </span>
      </div>
    </div>
  );
}
