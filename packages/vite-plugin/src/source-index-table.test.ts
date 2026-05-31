import { describe, expect, it } from "vitest";
import { enrichTableIndexFromSource } from "./source-index-table.js";
import type { IndexWireEntry } from "@nuvio/shared";

const TABLE_SOURCE = `
const tableData = [
  { id: 1, name: "MacBook Pro 13\\"", category: "Laptop", price: "$2399.00" },
  { id: 2, name: "Apple Watch", category: "Watch", price: "$879.00" },
];
export function RecentOrders() {
  return (
    <div data-nuvio-id="orders.section">
      <h3 data-nuvio-id="orders.title">Recent Orders</h3>
      <div data-nuvio-id="orders.table">
        {tableData.map((product) => (
          <tr data-nuvio-id={\`orders.row.\${product.id}\`}>
            <p data-nuvio-id={\`orders.row.\${product.id}.nameText\`}>{product.name}</p>
          </tr>
        ))}
      </div>
    </div>
  );
}
`;

describe("enrichTableIndexFromSource", () => {
  it("attaches rowTargets and tableMeta to section host", () => {
    const entries: IndexWireEntry[] = [
      {
        id: "orders.section",
        file: "/proj/RecentOrders.tsx",
        line: 8,
        column: 1,
        hierarchyRole: "section",
      },
      {
        id: "orders.title",
        file: "/proj/RecentOrders.tsx",
        line: 9,
        column: 1,
        textEditable: true,
      },
      {
        id: "orders.table",
        file: "/proj/RecentOrders.tsx",
        line: 10,
        column: 1,
      },
      {
        id: "orders.header.products",
        file: "/proj/RecentOrders.tsx",
        line: 20,
        column: 1,
        textEditable: true,
        textTargets: [
          {
            key: "self",
            label: "Products",
            file: "/proj/RecentOrders.tsx",
            line: 20,
            column: 1,
            tagName: "th",
            textEditable: true,
            textPreview: "Products",
            patchHostId: "orders.header.products",
          },
        ],
      },
      {
        id: "orders.row.1",
        file: "/proj/RecentOrders.tsx",
        line: 12,
        column: 1,
        textTargets: [
          {
            key: "name",
            label: "name",
            file: "/proj/RecentOrders.tsx",
            line: 13,
            column: 1,
            tagName: "p",
            textEditable: false,
            textPreview: 'MacBook Pro 13"',
            nuvioId: "orders.row.1.nameText",
            patchHostId: "orders.row.1.nameText",
          },
        ],
      },
      {
        id: "orders.row.2",
        file: "/proj/RecentOrders.tsx",
        line: 12,
        column: 1,
      },
      {
        id: "orders.row.1.nameText",
        file: "/proj/RecentOrders.tsx",
        line: 13,
        column: 1,
        textEditable: false,
      },
    ];

    enrichTableIndexFromSource(entries, new Map([["/proj/RecentOrders.tsx", TABLE_SOURCE]]));

    const section = entries.find((e) => e.id === "orders.section");
    expect(section?.rowTargets?.length).toBe(2);
    expect(section?.rowTargets?.[0]?.label).toContain("MacBook");
    expect(section?.tableMeta).toMatchObject({
      dataBinding: "tableData",
      line: 2,
    });
    expect(section?.tableMeta?.columns).toContain("Products");

    const cell = entries.find((e) => e.id === "orders.row.1.nameText");
    expect(cell?.tableDataField).toEqual({
      arrayName: "tableData",
      rowKey: "1",
      field: "name",
    });
  });
});
