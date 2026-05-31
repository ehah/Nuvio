import { describe, expect, it } from "vitest";
import type { IndexWireEntry } from "@nuvio/shared";
import {
  containsSimpleModeNamingLeak,
  formatColumnHeaderTitle,
  formatRowDisplayName,
  formatSelectionTitle,
  formatTableBackLabel,
  formatTableDisplayName,
  resolveTableHostPrefix,
} from "./human-naming.js";
import { buildSimpleBackNav } from "./simple-mode-nav.js";

function ordersFixture(): IndexWireEntry[] {
  return [
    {
      id: "orders.title",
      file: "RecentOrders.tsx",
      line: 1,
      column: 1,
      textTargets: [
        {
          key: "t",
          label: "title",
          file: "RecentOrders.tsx",
          line: 1,
          column: 1,
          tagName: "h3",
          textEditable: true,
          textPreview: "Recent Orders",
          nuvioId: "orders.title",
          patchHostId: "orders.title",
        },
      ],
    },
    {
      id: "orders.section",
      file: "RecentOrders.tsx",
      line: 1,
      column: 1,
      hierarchyRole: "table",
      rowTargets: [
        { rowKey: "1", nuvioId: "orders.row.1", label: "Row 1", file: "a.tsx", line: 1 },
        { rowKey: "2", nuvioId: "orders.row.2", label: "Row 2", file: "a.tsx", line: 1 },
      ],
    },
    {
      id: "orders.header.products",
      file: "RecentOrders.tsx",
      line: 1,
      column: 1,
      textTargets: [
        {
          key: "h",
          label: "header",
          file: "RecentOrders.tsx",
          line: 1,
          column: 1,
          tagName: "th",
          textEditable: true,
          textPreview: "Products",
          nuvioId: "orders.header.products",
          patchHostId: "orders.header.products",
        },
      ],
    },
    {
      id: "orders.header.category",
      file: "RecentOrders.tsx",
      line: 1,
      column: 1,
      textTargets: [
        {
          key: "h",
          label: "header",
          file: "RecentOrders.tsx",
          line: 1,
          column: 1,
          tagName: "th",
          textEditable: true,
          textPreview: "Category101",
          nuvioId: "orders.header.category",
          patchHostId: "orders.header.category",
        },
      ],
    },
    {
      id: "orders.row.1.nameText",
      file: "RecentOrders.tsx",
      line: 1,
      column: 1,
      textTargets: [
        {
          key: "n",
          label: "name",
          file: "RecentOrders.tsx",
          line: 1,
          column: 1,
          tagName: "p",
          textEditable: true,
          textPreview: 'MacBook Pro 13"',
          nuvioId: "orders.row.1.nameText",
          patchHostId: "orders.row.1.nameText",
        },
      ],
    },
    {
      id: "orders.row.2.nameText",
      file: "RecentOrders.tsx",
      line: 1,
      column: 1,
      textTargets: [
        {
          key: "n",
          label: "name",
          file: "RecentOrders.tsx",
          line: 1,
          column: 1,
          tagName: "p",
          textEditable: true,
          textPreview: "Apple Watch Ultra Test",
          nuvioId: "orders.row.2.nameText",
          patchHostId: "orders.row.2.nameText",
        },
      ],
    },
    { id: "orders.row.2", file: "RecentOrders.tsx", line: 1, column: 1 },
    { id: "metric.orders.card", file: "EcommerceMetrics.tsx", line: 1, column: 1 },
    { id: "metric.orders.label", file: "EcommerceMetrics.tsx", line: 1, column: 1 },
    { id: "metric.orders.value", file: "EcommerceMetrics.tsx", line: 1, column: 1 },
  ];
}

describe("resolveTableHostPrefix", () => {
  const entries = ordersFixture();

  it("returns orders for nested table ids", () => {
    expect(resolveTableHostPrefix("orders.row.2.nameText", entries)).toBe("orders");
    expect(resolveTableHostPrefix("orders.row.2", entries)).toBe("orders");
    expect(resolveTableHostPrefix("orders.header.products", entries)).toBe("orders");
  });
});

describe("formatSelectionTitle — Rule 6 naming", () => {
  const entries = ordersFixture();

  it("metric.orders.card → Orders Card", () => {
    expect(formatSelectionTitle("metric.orders.card", entries[7], entries)).toBe("Orders Card");
  });

  it("metric.orders.label → Card Label", () => {
    expect(formatSelectionTitle("metric.orders.label", entries[8], entries)).toBe("Card Label");
  });

  it("metric.orders.value → Card Value", () => {
    expect(formatSelectionTitle("metric.orders.value", entries[9], entries)).toBe("Card Value");
  });

  it("orders.header.products → Products Header", () => {
    expect(formatSelectionTitle("orders.header.products", entries[2], entries)).toBe(
      "Products Header",
    );
  });

  it("orders.header.category → Category Header", () => {
    expect(formatSelectionTitle("orders.header.category", entries[3], entries)).toBe(
      "Category Header",
    );
  });

  it("orders.row.1.nameText → Product Name", () => {
    expect(formatSelectionTitle("orders.row.1.nameText", entries[4], entries)).toBe("Product Name");
  });

  it("orders.row.2 → Apple Watch Ultra Test Row", () => {
    const title = formatSelectionTitle("orders.row.2", entries[6], entries);
    expect(title).toBe("Apple Watch Ultra Test Row");
    expect(title).not.toMatch(/Row 2 · row/i);
  });

  it("orders.row.2.nameText → Product Name without NameText leak", () => {
    const title = formatSelectionTitle("orders.row.2.nameText", entries[5], entries);
    expect(title).toBe("Product Name");
    expect(title).not.toContain("NameText");
  });

  it("orders.row.2.priceText → Product Price", () => {
    expect(formatSelectionTitle("orders.row.2.priceText", undefined, entries)).toBe(
      "Product Price",
    );
  });

  it("unknown row with no label → Product Row", () => {
    expect(formatSelectionTitle("orders.row.99", undefined, entries)).toBe("Product Row");
  });
});

describe("formatTableBackLabel", () => {
  it("uses table title metadata", () => {
    const entries = ordersFixture();
    expect(formatTableBackLabel("orders.row.2.nameText", entries)).toBe("← Recent Orders Table");
  });
});

describe("buildSimpleBackNav", () => {
  const entries = ordersFixture();
  const noop = () => {};

  it("table cell back → ← Recent Orders Table", () => {
    const nav = buildSimpleBackNav({
      mode: "table",
      selectedId: "orders.row.2.nameText",
      indexEntries: entries,
      cardPrefix: null,
      tablePrefix: "orders",
      chartPrefix: "",
      formPrefix: "",
      tableTask: "rows",
      cardTaskAtMenu: false,
      tableTaskAtMenu: false,
      buttonTaskAtMenu: false,
      formTaskAtMenu: false,
      chartTaskAtMenu: false,
      sectionTaskAtMenu: false,
      navTaskAtMenu: false,
      onNavigate: noop,
      onResetTask: noop,
    });
    expect(nav?.label).toBe("← Recent Orders Table");
  });

  it("card label back → ← Orders Card", () => {
    const nav = buildSimpleBackNav({
      mode: "card",
      selectedId: "metric.orders.label",
      indexEntries: entries,
      cardPrefix: "metric.orders",
      tablePrefix: "",
      chartPrefix: "",
      formPrefix: "",
      cardTask: "label",
      cardTaskAtMenu: false,
      tableTaskAtMenu: false,
      buttonTaskAtMenu: false,
      formTaskAtMenu: false,
      chartTaskAtMenu: false,
      sectionTaskAtMenu: false,
      navTaskAtMenu: false,
      onNavigate: noop,
      onResetTask: noop,
    });
    expect(nav?.label).toBe("← Orders Card");
  });

  it("card style back → ← Card Options", () => {
    const nav = buildSimpleBackNav({
      mode: "card",
      selectedId: "metric.orders.card",
      indexEntries: entries,
      cardPrefix: "metric.orders",
      tablePrefix: "",
      chartPrefix: "",
      formPrefix: "",
      cardTask: "cardStyle",
      cardTaskAtMenu: false,
      tableTaskAtMenu: false,
      buttonTaskAtMenu: false,
      formTaskAtMenu: false,
      chartTaskAtMenu: false,
      sectionTaskAtMenu: false,
      navTaskAtMenu: false,
      onNavigate: noop,
      onResetTask: noop,
    });
    expect(nav?.label).toBe("← Card Options");
  });
});

describe("Simple Mode naming leak guard", () => {
  const entries = ordersFixture();

  it("never leaks implementation fragments in titles, backs, or chip labels", () => {
    const cases: { id: string; entry?: IndexWireEntry }[] = [
      { id: "orders.row.2.nameText", entry: entries[5] },
      { id: "orders.row.2", entry: entries[6] },
      { id: "orders.header.products", entry: entries[2] },
      { id: "metric.orders.label", entry: entries[8] },
    ];

    for (const { id, entry } of cases) {
      const title = formatSelectionTitle(id, entry, entries);
      const chip = `Selected ${title}`;

      for (const text of [title, chip]) {
        expect(text).not.toMatch(/nameText|valueText|· row|2 Table|NameText Table/i);
        expect(text).not.toContain("orders.");
        expect(text).not.toContain("metric.");
        expect(containsSimpleModeNamingLeak(text)).toBe(false);
      }
    }

    expect(formatTableBackLabel("orders.row.2.nameText", entries)).toBe("← Recent Orders Table");
    expect(formatTableBackLabel("orders.row.2.nameText", entries)).not.toMatch(/NameText|2 Table/i);
  });
});

describe("formatRowDisplayName", () => {
  it("prefers product preview over row key", () => {
    const entries = ordersFixture();
    expect(formatRowDisplayName("orders.row.2", entries[6], entries)).toBe(
      "Apple Watch Ultra Test Row",
    );
  });
});

describe("formatColumnHeaderTitle", () => {
  it("maps known column slugs", () => {
    const entries = ordersFixture();
    expect(formatColumnHeaderTitle("orders.header.products", entries[2], entries)).toBe(
      "Products Header",
    );
  });
});

describe("formatTableDisplayName", () => {
  it("never produces numeric table names", () => {
    const entries = ordersFixture();
    expect(formatTableDisplayName("orders.row.2.nameText", entries)).toBe("Recent Orders Table");
    expect(formatTableDisplayName("orders.row.2.nameText", entries)).not.toMatch(/\d+ Table/);
  });
});
