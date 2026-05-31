import type { IndexWireEntry } from "@nuvio/shared";

const TABLE_CELL_FIELD_TITLES: Record<string, string> = {
  nameText: "Product Name",
  name: "Product Name",
  valueText: "Product Value",
  category: "Product Category",
  categoryText: "Product Category",
  price: "Product Price",
  priceText: "Product Price",
  status: "Order Status",
  statusText: "Order Status",
};

const HEADER_COLUMN_TITLES: Record<string, string> = {
  products: "Products Header",
  category: "Category Header",
  price: "Price Header",
  status: "Status Header",
};

const TECHNICAL_SUFFIXES = new Set([
  "nameText",
  "valueText",
  "priceText",
  "categoryText",
  "statusText",
  "name",
  "price",
  "category",
  "status",
  "row",
  "header",
  "section",
  "table",
  "title",
  "card",
  "label",
  "value",
]);

/** Id fragments that must never appear in Simple Mode titles, backs, or chips. */
export const SIMPLE_MODE_NAMING_LEAK_PATTERN =
  /(?:^|[\s·←])(?:nameText|valueText|priceText|categoryText|statusText|data-nuvio-id|metric\.|orders\.row\.|\d+ Table|· row\b)/i;

export function containsSimpleModeNamingLeak(text: string): boolean {
  return SIMPLE_MODE_NAMING_LEAK_PATTERN.test(text);
}

function textPreviewForId(id: string, entry?: IndexWireEntry | null): string | undefined {
  if (!entry) {
    return undefined;
  }
  const byNuvioId = entry.textTargets?.find((t) => t.nuvioId === id);
  if (byNuvioId?.textPreview) {
    return byNuvioId.textPreview;
  }
  if (entry.id === id) {
    return entry.textTargets?.find((t) => t.textPreview)?.textPreview;
  }
  return entry.textTargets?.find((t) => t.nuvioId === id)?.textPreview;
}

function titleCaseWords(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function findEntry(id: string, indexEntries?: readonly IndexWireEntry[] | null): IndexWireEntry | undefined {
  return indexEntries?.find((e) => e.id === id);
}

function rowHostIdFromId(id: string): string | null {
  const m = id.match(/^(.+\.row\.[^.]+)/);
  return m ? m[1] : null;
}

function findRowTarget(
  rowHostId: string,
  entry?: IndexWireEntry | null,
  indexEntries?: readonly IndexWireEntry[] | null,
) {
  const onEntry = entry?.rowTargets?.find((r) => r.nuvioId === rowHostId);
  if (onEntry) {
    return onEntry;
  }
  for (const e of indexEntries ?? []) {
    const hit = e.rowTargets?.find((r) => r.nuvioId === rowHostId);
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

/** Stable table host prefix — always `orders` for `orders.row.2.nameText`, never row keys. */
export function resolveTableHostPrefix(
  id: string,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  const byStructure = id.match(/^([^.]+)\.(?:section|table|title|header|row)\./);
  if (byStructure) {
    return byStructure[1];
  }
  if (id.endsWith(".section") || id.endsWith(".table")) {
    return id.replace(/\.(section|table)$/, "");
  }
  const root = id.split(".")[0];
  if (
    indexEntries?.some(
      (e) => e.id === `${root}.section` || e.id === `${root}.table` || e.hierarchyRole === "table",
    )
  ) {
    return root;
  }
  return id.replace(/\.(section|table)$/, "");
}

export function formatCardGroupName(
  prefix: string,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  const normalized = prefix.includes(".row.") || prefix.includes(".header.")
    ? resolveTableHostPrefix(prefix, indexEntries)
    : prefix.replace(/\.(card|label|value)$/, "");

  const cardTitleId = `${normalized}.title`;
  const cardTitleEntry = findEntry(cardTitleId, indexEntries);
  const cardTitlePreview = textPreviewForId(cardTitleId, cardTitleEntry);
  if (cardTitlePreview && !normalized.includes(".row.")) {
    const trimmed = cardTitlePreview.replace(/\s+(chart|table|section)$/i, "").trim();
    if (trimmed && !TECHNICAL_SUFFIXES.has(trimmed.toLowerCase())) {
      return trimmed;
    }
  }

  const tableTitleId = `${resolveTableHostPrefix(normalized, indexEntries)}.title`;
  const tableTitleEntry = findEntry(tableTitleId, indexEntries);
  const tableTitlePreview = textPreviewForId(tableTitleId, tableTitleEntry);
  if (tableTitlePreview) {
    return tableTitlePreview.replace(/\s+(chart|table|section)$/i, "").trim() || tableTitlePreview;
  }

  const last = normalized.split(".").pop() ?? normalized;
  if (/^\d+$/.test(last) || TECHNICAL_SUFFIXES.has(last)) {
    const parent = normalized.split(".").slice(-2, -1)[0];
    if (parent && !/^\d+$/.test(parent)) {
      return titleCaseWords(parent.replace(/[-_]/g, " "));
    }
  }
  return titleCaseWords(last.replace(/[-_]/g, " "));
}

/** Visible table name, e.g. "Recent Orders Table". */
export function formatTableDisplayName(
  idOrPrefix: string,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  const prefix = resolveTableHostPrefix(idOrPrefix, indexEntries);
  const titleEntry = findEntry(`${prefix}.title`, indexEntries);
  const titlePreview = textPreviewForId(`${prefix}.title`, titleEntry);
  if (titlePreview) {
    const base = titlePreview.replace(/\s+table$/i, "").trim();
    return `${base} Table`;
  }
  const group = formatCardGroupName(prefix, indexEntries);
  return `${group} Table`;
}

export function formatTableBackLabel(
  idOrPrefix: string,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  return `← ${formatTableDisplayName(idOrPrefix, indexEntries)}`;
}

export function formatCardDisplayName(
  prefix: string,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  return `${formatCardGroupName(prefix.replace(/\.(card|label|value)$/, ""), indexEntries)} Card`;
}

export function formatColumnHeaderTitle(
  id: string,
  entry?: IndexWireEntry | null,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  const headerMatch = id.match(/\.header\.(\w+)$/);
  if (!headerMatch) {
    return "Column Header";
  }
  const slug = headerMatch[1];
  const mapped = HEADER_COLUMN_TITLES[slug];
  if (mapped) {
    return mapped;
  }
  const preview = textPreviewForId(id, entry ?? findEntry(id, indexEntries));
  if (preview) {
    return `${preview} Header`;
  }
  return `${titleCaseWords(slug.replace(/[-_]/g, " "))} Header`;
}

function rowProductPreview(
  rowHostId: string,
  entry?: IndexWireEntry | null,
  indexEntries?: readonly IndexWireEntry[] | null,
): string | undefined {
  const nameTextId = `${rowHostId}.nameText`;
  const nameId = `${rowHostId}.name`;
  const nameTextEntry = findEntry(nameTextId, indexEntries) ?? entry;
  const preview =
    textPreviewForId(nameTextId, nameTextEntry) ??
    textPreviewForId(nameId, findEntry(nameId, indexEntries));
  if (preview) {
    return preview;
  }
  const rowTarget = findRowTarget(rowHostId, entry, indexEntries);
  if (rowTarget?.label && !/^Row \d+$/i.test(rowTarget.label) && rowTarget.label !== "row") {
    return rowTarget.label;
  }
  return undefined;
}

export function formatRowDisplayName(
  id: string,
  entry?: IndexWireEntry | null,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  const cellMatch = id.match(/\.row\.([^.]+)\.(\w+)$/);
  if (cellMatch) {
    const suffix = cellMatch[2];
    if (TABLE_CELL_FIELD_TITLES[suffix]) {
      return TABLE_CELL_FIELD_TITLES[suffix];
    }
    return titleCaseWords(suffix.replace(/[-_]/g, " "));
  }

  const rowMatch = id.match(/\.row\.([^.]+)$/);
  if (!rowMatch) {
    return "Product Row";
  }

  const rowHostId = rowHostIdFromId(id) ?? id;
  const productName = rowProductPreview(rowHostId, entry, indexEntries);
  if (productName) {
    return `${productName} Row`;
  }

  const rowKey = rowMatch[1];
  if (/^\d+$/.test(rowKey)) {
    return "Product Row";
  }
  return "Product Row";
}

/** Panel + chip title — describes the visible thing being edited. */
export function formatSelectionTitle(
  id: string,
  entry?: IndexWireEntry | null,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  const cellMatch = id.match(/\.row\.[^.]+\.(\w+)$/);
  if (cellMatch && TABLE_CELL_FIELD_TITLES[cellMatch[1]]) {
    return TABLE_CELL_FIELD_TITLES[cellMatch[1]];
  }

  if (id.includes(".header.")) {
    return formatColumnHeaderTitle(id, entry, indexEntries);
  }

  if (/\.row\.[^.]+$/.test(id) && !isTableCellId(id)) {
    const productName = rowProductPreview(id, entry, indexEntries);
    if (productName) {
      return `${productName} Row`;
    }
    const rowKey = id.match(/\.row\.([^.]+)$/)?.[1];
    if (rowKey && /^\d+$/.test(rowKey)) {
      return "Product Row";
    }
    return "Product Row";
  }

  const cardTrio = id.match(/^(.+)\.(card|label|value)$/);
  if (cardTrio) {
    const [, prefix, role] = cardTrio;
    if (role === "card") {
      return formatCardDisplayName(prefix, indexEntries);
    }
    if (role === "label") {
      return "Card Label";
    }
    return "Card Value";
  }

  if (id.endsWith(".section") || id.endsWith(".table")) {
    return formatTableDisplayName(id, indexEntries);
  }

  if (id.endsWith(".title")) {
    const prefix = resolveTableHostPrefix(id.replace(/\.title$/, ""), indexEntries);
    if (indexEntries?.some((e) => e.id === `${prefix}.table` || e.id === `${prefix}.section`)) {
      return "Table Title";
    }
    if (id.includes(".chart") || id.startsWith("chart.")) {
      return "Chart Title";
    }
    return "Section Title";
  }

  if (id.endsWith(".subtitle")) {
    return "Chart Subtitle";
  }

  if (entry?.hierarchyRole === "button" || id.includes(".filter") || id.includes(".cta")) {
    return "Button Text";
  }

  return formatFriendlyId(id, entry, indexEntries);
}

export function isTableCellId(id: string): boolean {
  return /\.row\.[^.]+\.\w+$/.test(id);
}

export function formatFriendlyId(
  id: string,
  entry?: IndexWireEntry | null,
  indexEntries?: readonly IndexWireEntry[] | null,
): string {
  if (isTableCellId(id) || id.includes(".header.") || /\.row\.[^.]+$/.test(id)) {
    return formatSelectionTitle(id, entry, indexEntries);
  }

  const preview = textPreviewForId(id, entry);

  if (id.endsWith(".title") && preview) {
    return preview;
  }
  if (id.endsWith(".title")) {
    return "Section Title";
  }
  if (id.endsWith(".section") || id.endsWith(".table")) {
    return formatTableDisplayName(id, indexEntries);
  }
  if (id.endsWith(".label") && preview) {
    return preview;
  }
  if (id.endsWith(".value") && preview) {
    return preview;
  }

  const cardTrio = id.match(/^(.+)\.(card|label|value)$/);
  if (cardTrio) {
    const [, prefix, role] = cardTrio;
    if (role === "card") {
      return formatCardDisplayName(prefix, indexEntries);
    }
    if (role === "label") {
      return "Card Label";
    }
    return "Card Value";
  }

  const parts = id.split(".").filter(Boolean);
  const slice = parts.length > 2 ? parts.slice(-2) : parts;
  const generic = slice
    .map((part) => part.replace(/[-_]/g, " "))
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return preview ?? generic;
}
