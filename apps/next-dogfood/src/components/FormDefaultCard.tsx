export function FormDefaultCard() {
  return (
    <div
      data-nuvio-id="forms.default.card"
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h3
        data-nuvio-id="forms.default.title"
        className="text-lg font-semibold text-gray-800 xl:text-base xl:font-medium xl:text-purple-600"
      >
        Default inputs
      </h3>
      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            data-nuvio-id="form.email.label"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            data-nuvio-id="form.email.input"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="name"
            data-nuvio-id="forms.default.input.label"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            data-nuvio-id="forms.default.input"
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>
    </div>
  );
}
