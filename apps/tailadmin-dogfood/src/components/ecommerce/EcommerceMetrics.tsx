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
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span
              data-nuvio-id="metric.customers.label"
              className="text-sm text-gray-500 xl:bg-white xl:text-lg dark:text-gray-400"
            >
              Customers101
            </span>
            <h4
              data-nuvio-id="metric.customers.value"
              className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90"
            >
              3,782
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
        className="rounded-2xl border border-gray-200 bg-white p-5 xl:rounded-xl xl:p-2 xl:bg-teal-100 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span
              data-nuvio-id="metric.orders.label"
              className="text-sm text-lime-500 dark:text-gray-400"
            >
              Customer Orders
            </span>
            <h4
              data-nuvio-id="metric.orders.value"
              className="mt-2 font-bold text-title-sm xl:text-red-600 dark:text-white/90"
            >
              5,35911 00
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
