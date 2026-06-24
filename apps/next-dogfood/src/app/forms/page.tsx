import { FormDefaultCard } from "@/components/FormDefaultCard";
export default function FormsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1
        data-nuvio-id="form.page.title"
        className="text-2xl font-semibold text-gray-900 xl:text-base xl:font-medium xl:text-purple-600"
      >
        Form elements
      </h1>
      <p className="text-sm text-gray-600">
        Brand Kit form category — labels and inputs with literal className
        hosts.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <FormDefaultCard />
        <div
          data-nuvio-id="forms.states.card"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3
            data-nuvio-id="forms.states.title"
            className="text-lg font-semibold text-gray-800 xl:text-base xl:font-medium xl:text-purple-600"
          >
            Input states
          </h3>
          <p
            data-nuvio-id="forms.states.desc"
            className="mt-2 text-sm text-gray-600"
          >
            Disabled and read-only fields for coverage demos.
          </p>
          <input
            disabled
            value="Disabled field"
            className="mt-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>
      </div>
    </main>
  );
}
