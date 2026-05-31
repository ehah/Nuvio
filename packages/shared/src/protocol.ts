import { z } from "zod";

/** Bump when wire payloads change incompatibly. */
export const PROTOCOL_VERSION = 7 as const;

export const riskLevelSchema = z.enum(["safe", "caution", "unsupported"]);

export type RiskLevel = z.infer<typeof riskLevelSchema>;

/** Index v3: editable text node under an instrumented host (Step 1). */
export const textTargetSchema = z.object({
  /** Stable within host: `data-nuvio-id` or `loc:line:column`. */
  key: z.string(),
  label: z.string(),
  file: z.string(),
  line: z.number().int(),
  column: z.number().int(),
  tagName: z.string(),
  textEditable: z.boolean(),
  textPreview: z.string().optional(),
  /** Present when the text node has its own `data-nuvio-id`. */
  nuvioId: z.string().optional(),
  /** Host id used for `mergeTailwindClassName` when patching styles for this target. */
  patchHostId: z.string(),
  insideMap: z.boolean().optional(),
});

export type TextWireTarget = z.infer<typeof textTargetSchema>;

/** Index v3: explicit style patch target under an instrumented host. */
export const styleTargetSchema = z.object({
  /** Stable key within host: `data-nuvio-id` or `host` for selected container. */
  key: z.string(),
  label: z.string(),
  file: z.string(),
  line: z.number().int(),
  column: z.number().int(),
  tagName: z.string(),
  nuvioId: z.string(),
  patchHostId: z.string(),
  classNamePatchable: z.boolean(),
  riskLevel: riskLevelSchema.optional(),
});

export type StyleWireTarget = z.infer<typeof styleTargetSchema>;

export const hierarchyRoleSchema = z.enum([
  "section",
  "card",
  "table",
  "form",
  "group",
  "layout",
  "text",
  "button",
  "input",
  "media",
  "unknown",
]);

/** Index v4: row host under a table section (`orders.row.{key}`). */
export const rowTargetSchema = z.object({
  rowKey: z.string(),
  nuvioId: z.string(),
  label: z.string(),
  file: z.string(),
  line: z.number().int(),
});

export type RowWireTarget = z.infer<typeof rowTargetSchema>;

/** Index v4: static `tableData` binding for Tier C cell edits. */
export const tableMetaSchema = z.object({
  dataBinding: z.string(),
  file: z.string(),
  line: z.number().int(),
  columns: z.array(z.string()).optional(),
});

export type TableMeta = z.infer<typeof tableMetaSchema>;

/** Index v4: patch cell copy via local array literal. */
export const tableDataFieldSchema = z.object({
  arrayName: z.string(),
  rowKey: z.string(),
  field: z.string(),
});

export type TableDataFieldBinding = z.infer<typeof tableDataFieldSchema>;

export type HierarchyRole = z.infer<typeof hierarchyRoleSchema>;

export const indexEntrySchema = z.object({
  id: z.string(),
  file: z.string(),
  line: z.number().int(),
  column: z.number().int(),
  /** Source index v2 metadata */
  tagName: z.string().optional(),
  componentName: z.string().optional(),
  hasLiteralClassName: z.boolean().optional(),
  classNameValue: z.string().optional(),
  textEditable: z.boolean().optional(),
  structuralEditable: z.boolean().optional(),
  riskLevel: riskLevelSchema.optional(),
  unsupportedReasons: z.array(z.string()).optional(),
  insideMap: z.boolean().optional(),
  /** Index v3: default id for className patches on this host. */
  patchHostId: z.string().optional(),
  /** Index v3: preferred text target key in `textTargets`. */
  primaryTextTargetKey: z.string().optional(),
  /** Index v3: descendant (and host) text edit targets. */
  textTargets: z.array(textTargetSchema).optional(),
  /** Index v3: explicit style patch targets for this selected host. */
  styleTargets: z.array(styleTargetSchema).optional(),
  /** Index v3: coarse host role, used for defaults/hints only. */
  hierarchyRole: hierarchyRoleSchema.optional(),
  /** Index v3: nearest ancestor host id in JSX ownership hierarchy. */
  parentHostId: z.string().optional(),
  /** Index v3: descendant host ids under this host (if any). */
  childTargetIds: z.array(z.string()).optional(),
  /** Index v4: row hosts when this entry is a table section. */
  rowTargets: z.array(rowTargetSchema).optional(),
  /** Index v4: static table data binding for Tier C. */
  tableMeta: tableMetaSchema.optional(),
  /** Index v4: when this host maps to a `tableData` field edit. */
  tableDataField: tableDataFieldSchema.optional(),
});

export type IndexWireEntry = z.infer<typeof indexEntrySchema>;

export const runtimeDiagnosticsSchema = z.object({
  viteVersion: z.string().optional(),
  reactVersion: z.string().optional(),
  tailwindVersion: z.string().optional(),
  overlayCssMode: z.literal("self-contained").optional(),
});

export type RuntimeDiagnostics = z.infer<typeof runtimeDiagnosticsSchema>;

export const duplicateIdOccurrenceSchema = z.object({
  file: z.string(),
  line: z.number().int(),
  column: z.number().int(),
});

export const duplicateIdErrorSchema = z.object({
  id: z.string(),
  occurrences: z.array(duplicateIdOccurrenceSchema),
});

export type DuplicateIdError = z.infer<typeof duplicateIdErrorSchema>;

export const clientPingSchema = z.object({
  type: z.literal("ping"),
  protocolVersion: z.number().int(),
  requestId: z.string().min(1),
});

export type ClientPing = z.infer<typeof clientPingSchema>;

export const clientSelectSchema = z.object({
  type: z.literal("select"),
  protocolVersion: z.number().int(),
  requestId: z.string().min(1),
  id: z.string().min(1),
});

export type ClientSelect = z.infer<typeof clientSelectSchema>;

export const patchOpSetTextSchema = z.object({
  kind: z.literal("setText"),
  text: z.string(),
});

export const patchOpMergeTailwindSchema = z.object({
  kind: z.literal("mergeTailwindClassName"),
  classNameFragment: z.string(),
});

/** Reorder host among JSX element siblings under a flex/grid parent (Phase 4). */
export const patchOpMoveSiblingSchema = z.object({
  kind: z.literal("moveSibling"),
  direction: z.enum(["up", "down"]),
});

/** Toggle `hidden` on a string-literal className (Phase 4 toolbar). */
export const patchOpSetHiddenSchema = z.object({
  kind: z.literal("setHidden"),
  hidden: z.boolean(),
});

/** Clone the host JSX element with a new unique `data-nuvio-id` (Phase 4 toolbar). */
export const patchOpDuplicateHostSchema = z.object({
  kind: z.literal("duplicateHost"),
});

/** Index v4: update a string field in a local `const` array (Tier C table cells). */
export const patchOpSetTableDataFieldSchema = z.object({
  kind: z.literal("setTableDataField"),
  arrayName: z.string(),
  rowKey: z.string(),
  field: z.string(),
  value: z.string(),
});

export const patchOpSchema = z.discriminatedUnion("kind", [
  patchOpSetTextSchema,
  patchOpMergeTailwindSchema,
  patchOpMoveSiblingSchema,
  patchOpSetHiddenSchema,
  patchOpDuplicateHostSchema,
  patchOpSetTableDataFieldSchema,
]);

export type PatchOp = z.infer<typeof patchOpSchema>;
export const breakpointSchema = z.enum(["base", "sm", "md", "lg", "xl"]);
export type Breakpoint = z.infer<typeof breakpointSchema>;

export const clientPatchApplySchema = z.object({
  type: z.literal("patchApply"),
  protocolVersion: z.number().int(),
  requestId: z.string().min(1),
  id: z.string().min(1),
  ops: z.array(patchOpSchema).min(1),
  /** Optional responsive context for className merges. */
  activeBreakpoint: breakpointSchema.optional(),
  /** When true, server validates and returns `patchAck` with `diffSummary` but does not write disk or push undo. */
  dryRun: z.boolean().optional(),
});

export type ClientPatchApply = z.infer<typeof clientPatchApplySchema>;

export const clientPatchUndoSchema = z.object({
  type: z.literal("patchUndo"),
  protocolVersion: z.number().int(),
  requestId: z.string().min(1),
});

export type ClientPatchUndo = z.infer<typeof clientPatchUndoSchema>;

export const clientMessageSchema = z.discriminatedUnion("type", [
  clientPingSchema,
  clientSelectSchema,
  clientPatchApplySchema,
  clientPatchUndoSchema,
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export const serverPongSchema = z.object({
  type: z.literal("pong"),
  protocolVersion: z.number().int(),
  requestId: z.string(),
  diagnostics: runtimeDiagnosticsSchema.optional(),
});

export const serverErrorSchema = z.object({
  type: z.literal("error"),
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
});

export const serverIndexReadySchema = z.object({
  type: z.literal("indexReady"),
  protocolVersion: z.number().int(),
  indexVersion: z.number().int(),
  entries: z.array(indexEntrySchema),
  duplicateErrors: z.array(duplicateIdErrorSchema),
  diagnostics: runtimeDiagnosticsSchema.optional(),
});

export type ServerIndexReady = z.infer<typeof serverIndexReadySchema>;

export const serverSelectAckSchema = z.object({
  type: z.literal("selectAck"),
  protocolVersion: z.number().int(),
  requestId: z.string(),
  id: z.string(),
  ok: z.boolean(),
  file: z.string().optional(),
  line: z.number().int().optional(),
  column: z.number().int().optional(),
  /** Index v3 snapshot for the selected host (also on `indexReady` entries). */
  patchHostId: z.string().optional(),
  primaryTextTargetKey: z.string().optional(),
  textTargets: z.array(textTargetSchema).optional(),
  styleTargets: z.array(styleTargetSchema).optional(),
  hierarchyRole: hierarchyRoleSchema.optional(),
  parentHostId: z.string().optional(),
  childTargetIds: z.array(z.string()).optional(),
  rowTargets: z.array(rowTargetSchema).optional(),
  tableMeta: tableMetaSchema.optional(),
  tableDataField: tableDataFieldSchema.optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type ServerSelectAck = z.infer<typeof serverSelectAckSchema>;

export const serverPatchAckSchema = z.object({
  type: z.literal("patchAck"),
  protocolVersion: z.number().int(),
  requestId: z.string(),
  id: z.string(),
  ok: z.boolean(),
  diffSummary: z.string().optional(),
  /** Present when this ack is for a `patchApply` with `dryRun: true`. */
  dryRun: z.boolean().optional(),
  /** Absolute path written on successful non-dry apply (for touched-file log). */
  writtenFile: z.string().optional(),
  /** Server undo stack size after this apply (non-dry success only). */
  undoStackDepth: z.number().int().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type ServerPatchAck = z.infer<typeof serverPatchAckSchema>;

export const serverPatchUndoAckSchema = z.object({
  type: z.literal("patchUndoAck"),
  protocolVersion: z.number().int(),
  requestId: z.string(),
  ok: z.boolean(),
  file: z.string().optional(),
  /** Remaining in-memory undo snapshots after this undo (success only). */
  undoStackDepth: z.number().int().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type ServerPatchUndoAck = z.infer<typeof serverPatchUndoAckSchema>;

export const serverMessageSchema = z.discriminatedUnion("type", [
  serverPongSchema,
  serverErrorSchema,
  serverIndexReadySchema,
  serverSelectAckSchema,
  serverPatchAckSchema,
  serverPatchUndoAckSchema,
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

export function parseClientMessage(raw: string): ClientMessage | null {
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  const r = clientMessageSchema.safeParse(json);
  return r.success ? r.data : null;
}

export function parseServerMessage(raw: string): ServerMessage | null {
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  const r = serverMessageSchema.safeParse(json);
  return r.success ? r.data : null;
}

export function serializeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
