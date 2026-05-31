import { describe, expect, it } from "vitest";
import { extractIdsFromSource } from "./source-index.js";

describe("template data-nuvio-id expansion", () => {
  it("indexes orders.row.{id} from tableData.map template", () => {
    const code = [
      'const tableData = [{ id: 1, name: "A" }, { id: 2, name: "B" }];',
      "export function T() {",
      "  return (",
      "    <div>",
      "      {tableData.map((product) => (",
      "        <p key={product.id} data-nuvio-id={`orders.row.${product.id}.nameText`}>{product.name}</p>",
      "      ))}",
      "    </div>",
      "  );",
      "}",
    ].join("\n");
    const entries = extractIdsFromSource("/proj/T.tsx", code);
    const ids = entries.map((e) => e.id).sort();
    expect(ids).toContain("orders.row.1.nameText");
    expect(ids).toContain("orders.row.2.nameText");
  });
});
