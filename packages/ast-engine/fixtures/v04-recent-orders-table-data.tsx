const tableData = [
  { id: 1, name: "MacBook Pro 13”", price: "$2399.00" },
  { id: 2, name: "Apple Watch Ultra", price: "$879.00" },
];

export function RecentOrdersFixture() {
  return (
    <div data-nuvio-id="orders.row.1.nameText">
      {tableData[0]?.name}
    </div>
  );
}
