import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
interface Product {
  id: number;
  name: string;
  variants: string;
  category: string;
  price: string;
  image: string;
  status: "Delivered" | "Pending" | "Canceled";
}
const tableData: Product[] = [
  {
    id: 1,
    name: "MacBook Pro 13”",
    variants: "2 Variants",
    category: "Laptop",
    price: "$2399.00",
    status: "Delivered",
    image: "/images/product/product-01.jpg",
  },
  {
    id: 2,
    name: "Apple Watch Ultra Test",
    variants: "1 Variant",
    category: "Watch",
    price: "$879.00",
    status: "Pending",
    image: "/images/product/product-02.jpg",
  },
  {
    id: 3,
    name: "iPhone 15 Pro Max pro +",
    variants: "2 Variants",
    category: "SmartPhone",
    price: "$1869.00",
    status: "Delivered",
    image: "/images/product/product-03.jpg",
  },
  {
    id: 4,
    name: "iPad Pro 3rd Gen",
    variants: "2 Variants",
    category: "Electronics",
    price: "$1699.00",
    status: "Canceled",
    image: "/images/product/product-04.jpg",
  },
  {
    id: 5,
    name: "AirPods Pro 2nd Gen",
    variants: "1 Variant",
    category: "Accessories",
    price: "$240.00",
    status: "Delivered",
    image: "/images/product/product-05.jpg",
  },
];
export default function RecentOrders() {
  return (
    <div
      data-nuvio-id="orders.card"
      className="overflow-hidden bg-white border border-purple-300 rounded-md p-6 shadow-sm sm:px-6 xl:bg-white xl:border xl:border-blue-300 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] hover:border-rose-400 hover:border-rose-400 hover:border-blue-400"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3
            data-nuvio-id="orders.title"
            className="text-base font-medium text-purple-600 xl:text-base xl:font-medium xl:text-purple-600 dark:text-white/90"
          >
            Recent Orders
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-nuvio-id="orders.filter"
            type="button"
            className="inline-flex items-center gap-2 font-medium shadow-theme-xs bg-purple-600 text-white rounded-md px-4 py-2 xl:bg-purple-600 xl:text-white xl:rounded-md xl:px-4 xl:py-2 hover:bg-rose-700 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700 hover:bg-blue-700 hover:bg-rose-700 hover:bg-green-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-blue-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700"
          >
            Filter Button Test
          </button>
          <button
            data-nuvio-id="orders.seeAll"
            type="button"
            className="inline-flex items-center gap-2 font-medium shadow-theme-xs bg-purple-600 text-white rounded-md px-4 py-2 xl:bg-purple-600 xl:text-white xl:rounded-md xl:px-4 xl:py-2 hover:bg-rose-700 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700 hover:bg-blue-700 hover:bg-rose-700 hover:bg-green-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-blue-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-green-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700 hover:bg-purple-700"
          >
            See all
          </button>
        </div>
      </div>
      <div
        data-nuvio-id="orders.table"
        className="overflow-x-auto max-w-full border border-purple-300 rounded-md xl:max-w-full xl:border xl:border-gray-200 xl:rounded-md"
      >
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow data-nuvio-id="orders.header.row">
              <TableCell
                isHeader
                data-nuvio-id="orders.header.products"
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Products Sold
              </TableCell>
              <TableCell
                isHeader
                data-nuvio-id="orders.header.category"
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Category101
              </TableCell>
              <TableCell
                isHeader
                data-nuvio-id="orders.header.price"
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Price
              </TableCell>
              <TableCell
                isHeader
                data-nuvio-id="orders.header.status"
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((product) => (
              <TableRow
                key={product.id}
                data-nuvio-id={`orders.row.${product.id}`}
                className="border-0"
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                      <img
                        src={product.image}
                        className="h-[50px] w-[50px]"
                        alt={product.name}
                      />
                    </div>
                    <div>
                      <p
                        data-nuvio-id={`orders.row.${product.id}.nameText`}
                        className="font-medium text-gray-800 xl:text-sm xl:font-normal xl:text-gray-600 dark:text-white/90"
                      >
                        {product.name}
                      </p>
                      <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                        {product.variants}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {product.category}
                </TableCell>
                <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {product.price}
                </TableCell>
                <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      product.status === "Delivered"
                        ? "success"
                        : product.status === "Pending"
                          ? "warning"
                          : "error"
                    }
                  >
                    {product.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
