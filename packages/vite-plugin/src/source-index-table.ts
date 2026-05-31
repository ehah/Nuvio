import { parse } from "@babel/parser";
import traverseImport, { type NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { IndexWireEntry, RowWireTarget, TableMeta } from "@nuvio/shared";

function getTraverseFn(): (ast: t.File, visitor: object) => void {
  if (typeof traverseImport === "function") {
    return traverseImport as (ast: t.File, visitor: object) => void;
  }
  const d = (traverseImport as { default?: unknown }).default;
  if (typeof d === "function") {
    return d as (ast: t.File, visitor: object) => void;
  }
  throw new Error("[Nuvio] @babel/traverse did not resolve to a callable export");
}

type ArrayRow = { rowKey: string; fields: Record<string, string> };
type ArrayMeta = { rows: ArrayRow[]; line: number };

const TIER_C_SUFFIX_FIELDS: ReadonlyArray<{ suffix: string; field: string }> = [
  { suffix: "nameText", field: "name" },
  { suffix: "name", field: "name" },
  { suffix: "priceText", field: "price" },
  { suffix: "price", field: "price" },
  { suffix: "categoryText", field: "category" },
  { suffix: "category", field: "category" },
];

function parseTableDataArray(code: string, file: string): Map<string, ArrayMeta> {
  const out = new Map<string, ArrayMeta>();
  let ast: t.File;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      sourceFilename: file,
    });
  } catch {
    return out;
  }

  const traverseFn = getTraverseFn();
  traverseFn(ast, {
    VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
      if (!t.isIdentifier(path.node.id)) {
        return;
      }
      const name = path.node.id.name;
      if (!name.endsWith("Data") && name !== "tableData") {
        return;
      }
      if (!t.isArrayExpression(path.node.init)) {
        return;
      }
      const rows: ArrayRow[] = [];
      for (const el of path.node.init.elements) {
        if (!el || !t.isObjectExpression(el)) {
          continue;
        }
        const fields: Record<string, string> = {};
        let rowKey = String(rows.length + 1);
        for (const prop of el.properties) {
          if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) {
            continue;
          }
          const key = prop.key.name;
          if (key === "id" && t.isNumericLiteral(prop.value)) {
            rowKey = String(prop.value.value);
          } else if (t.isStringLiteral(prop.value)) {
            fields[key] = prop.value.value;
          }
        }
        rows.push({ rowKey, fields });
      }
      if (rows.length > 0) {
        const line = path.node.loc?.start.line ?? 1;
        out.set(name, { rows, line });
      }
    },
  });
  return out;
}

function tableSectionPrefix(id: string): string | null {
  if (id.endsWith(".section") || id.endsWith(".table")) {
    return id.replace(/\.(section|table)$/, "");
  }
  const m = id.match(/^(.+)\.row\./);
  return m?.[1] ?? null;
}

function collectTableColumns(entries: IndexWireEntry[], prefix: string): string[] {
  return entries
    .filter((e) => e.id.startsWith(`${prefix}.header.`) && !e.id.endsWith(".row"))
    .map((e) => {
      const slug = e.id.split(".").pop() ?? e.id;
      const preview = e.textTargets?.[0]?.textPreview;
      return preview ?? slug;
    });
}

function enrichRowTargets(entries: IndexWireEntry[]): void {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const rowBySection = new Map<string, RowWireTarget[]>();

  for (const e of entries) {
    const m = e.id.match(/^(.+)\.row\.([^.]+)$/);
    if (!m) {
      continue;
    }
    const prefix = m[1];
    const rowKey = m[2];
    const label =
      e.textTargets?.find((t) => t.textPreview)?.textPreview ??
      e.textTargets?.[0]?.label ??
      formatFriendlyRowLabel(rowKey);
    const row: RowWireTarget = {
      rowKey,
      nuvioId: e.id,
      label,
      file: e.file,
      line: e.line,
    };
    const list = rowBySection.get(prefix) ?? [];
    list.push(row);
    rowBySection.set(prefix, list);
  }

  for (const [prefix, rows] of rowBySection) {
    const sectionId = `${prefix}.section`;
    const tableId = `${prefix}.table`;
    const host = byId.get(sectionId) ?? byId.get(tableId);
    if (host) {
      host.rowTargets = rows.sort((a, b) => a.rowKey.localeCompare(b.rowKey));
      if (!host.hierarchyRole || host.hierarchyRole === "group" || host.hierarchyRole === "section") {
        host.hierarchyRole = "table";
      }
    }
  }
}

function formatFriendlyRowLabel(rowKey: string): string {
  return `Row ${rowKey}`;
}

export function enrichTableIndexFromSource(
  entries: IndexWireEntry[],
  fileToSource: Map<string, string>,
): void {
  enrichRowTargets(entries);

  const fileArrays = new Map<string, Map<string, ArrayMeta>>();
  for (const [file, code] of fileToSource) {
    fileArrays.set(file, parseTableDataArray(code, file));
  }

  for (const e of entries) {
    const arrays = fileArrays.get(e.file);
    if (!arrays) {
      continue;
    }

    const rowMatch = e.id.match(/^(.+)\.row\.([^.]+)\.(\w+)$/);
    if (!rowMatch) {
      continue;
    }
    const rowKey = rowMatch[2];
    const suffix = rowMatch[3];
    const binding = TIER_C_SUFFIX_FIELDS.find((b) => b.suffix === suffix);
    if (!binding) {
      continue;
    }

    for (const [arrayName, meta] of arrays) {
      const row = meta.rows.find((r) => r.rowKey === rowKey);
      if (!row?.fields[binding.field]) {
        continue;
      }
      e.tableDataField = {
        arrayName,
        rowKey,
        field: binding.field,
      };
      const prefix = tableSectionPrefix(e.id) ?? e.id.split(".row.")[0];
      const section = entries.find(
        (x) => x.id === `${prefix}.section` || x.id === `${prefix}.table`,
      );
      if (section) {
        const columns = collectTableColumns(entries, prefix);
        section.tableMeta = {
          dataBinding: arrayName,
          file: e.file,
          line: meta.line,
          columns: columns.length > 0 ? columns : Object.keys(meta.rows[0]?.fields ?? {}),
        } satisfies TableMeta;
      }
      break;
    }
  }
}

export function inferTableHierarchyRole(id: string, tagName: string): boolean {
  if (id.includes(".table") || id.includes(".header.") || /\.row\./.test(id)) {
    return true;
  }
  const lower = tagName.toLowerCase();
  return lower.includes("table") || lower === "tablerow" || lower === "tablecell";
}
