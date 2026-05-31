interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
}

const tableData: Product[] = [
  { id: 1, name: "MacBook Pro 13”", category: "Laptop", price: "$2399.00" },
  { id: 2, name: "Apple Watch Ultra", category: "Watch", price: "$879.00" },
  { id: 3, name: "iPhone 15 Pro Max", category: "SmartPhone", price: "$1869.00" },
];

export function RecentOrders() {
  return (
    <div
      data-nuvio-id="orders.section"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 sm:px-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3
          data-nuvio-id="orders.title"
          className="text-lg font-semibold text-gray-800"
        >
          Recent Orders
        </h3>
        <button
          data-nuvio-id="orders.seeAll"
          type="button"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          See all
        </button>
      </div>
      <div data-nuvio-id="orders.table" className="max-w-full overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-y border-gray-100">
            <tr data-nuvio-id="orders.header.row">
              <th
                data-nuvio-id="orders.header.products"
                className="py-3 font-medium text-gray-500"
              >
                Products
              </th>
              <th
                data-nuvio-id="orders.header.category"
                className="py-3 font-medium text-gray-500"
              >
                Category
              </th>
              <th
                data-nuvio-id="orders.header.price"
                className="py-3 font-medium text-gray-500"
              >
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((product) => (
              <tr
                key={product.id}
                data-nuvio-id={`orders.row.${product.id}`}
                className="border-b border-gray-100"
              >
                <td className="py-3">
                  <p
                    data-nuvio-id={`orders.row.${product.id}.nameText`}
                    className="font-medium text-gray-800"
                  >
                    {product.name}
                  </p>
                </td>
                <td className="py-3 text-gray-500">{product.category}</td>
                <td className="py-3 text-gray-500">{product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
