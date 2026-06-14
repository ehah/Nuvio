import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
export default function EcommerceMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div
        data-nuvio-id="metric.customers.card"
        className="bg-white border border-rose-300 rounded-md p-6 md:p-6 xl:text-red-700 xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] hover:border-rose-400 hover:border-rose-400 hover:border-blue-400"
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span
              data-nuvio-id="metric.customers.label"
              className="text-sm font-normal text-gray-600 xl:bg-white xl:text-sm xl:font-normal xl:text-gray-700 dark:text-gray-400"
            >
              Customers Purchases
            </span>
            <h4
              data-nuvio-id="metric.customers.value"
              className="mt-2 text-sm font-normal text-gray-600 xl:text-sm xl:font-normal xl:text-gray-700 dark:text-white/90"
            >
              3,782 00
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div
        data-nuvio-id="metric.orders.card"
        className="bg-white border border-rose-300 rounded-md p-6 md:p-4 md:gap-2 xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] hover:border-rose-400 hover:border-rose-400 hover:border-blue-400"
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span
              data-nuvio-id="metric.orders.label"
              className="text-sm font-normal text-gray-600 xl:text-sm xl:font-normal xl:text-gray-700 dark:text-gray-400"
            >
              Orders
            </span>
            <h4
              data-nuvio-id="metric.orders.value"
              className="mt-2 text-sm font-normal text-gray-600 xl:text-sm xl:font-normal xl:text-gray-700 dark:text-white/90"
            >
              5,35911201
            </h4>
          </div>

          <Badge color="error">
            <ArrowDownIcon />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
