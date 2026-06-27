import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2
          data-nuvio-id="tables.page.title"
          className="text-base font-medium text-green-600 xl:text-base xl:font-medium xl:text-purple-600 dark:text-white/90"
        >
          Basic Tables
        </h2>
      </div>
      <div className="space-y-6">
        <div
          data-nuvio-id="tables.basic.card"
          className="bg-white border border-green-300 rounded-md p-6 shadow-sm xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:p-6 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div className="px-6 py-5">
            <h3
              data-nuvio-id="tables.basic.title"
              className="text-base font-medium text-green-600 xl:text-base xl:font-medium xl:text-purple-600 dark:text-white/90"
            >
              Basic Table 1
            </h3>
          </div>
          <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
            <BasicTableOne />
          </div>
        </div>
      </div>
    </>
  );
}
