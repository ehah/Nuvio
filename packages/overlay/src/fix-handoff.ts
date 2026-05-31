export type FixHandoffContext = {
  componentName?: string;
  hostId: string;
  file?: string;
  line?: number;
  userIntent: string;
  reason: string;
  suggestedNextStep: string;
};

export function buildFixHandoffClipboard(ctx: FixHandoffContext): string {
  const fileLine =
    ctx.file != null
      ? `${ctx.file}${ctx.line != null ? `:${ctx.line}` : ""}`
      : "(unknown file)";
  const component = ctx.componentName ?? ctx.hostId;

  return [
    "Nuvio could not apply this edit safely.",
    "",
    `Component: ${component} (${ctx.hostId})`,
    `File: ${fileLine}`,
    `You tried: ${ctx.userIntent}`,
    `Reason: ${ctx.reason}`,
    "",
    `Suggested next step: ${ctx.suggestedNextStep}`,
    "",
    "Optional prompt for Cursor:",
    `"In ${ctx.file ?? "the component file"}, ${ctx.suggestedNextStep}"`,
  ].join("\n");
}

export const MAKE_TABLE_EDITABLE_SNIPPET = `Add Nuvio table ids (v0.4 contract):
- Section wrapper: data-nuvio-id="{host}.section"
- Title h3: data-nuvio-id="{host}.title"
- Table scroll area: data-nuvio-id="{host}.table"
- Header cells: data-nuvio-id="{host}.header.products" (per column)
- Each row: data-nuvio-id="{host}.row.{id}" with literal className
- Cell text: data-nuvio-id="{host}.row.{id}.nameText" when using tableData.map()
Keep header and title text as string literals for in-panel editing.`;

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Build cursor:// or vscode:// link when file path is known. */
export function buildEditorUrl(file?: string, line?: number): string | null {
  if (!file) {
    return null;
  }
  const scheme =
    typeof globalThis !== "undefined" &&
    "process" in globalThis &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.NUVIO_EDITOR_URL
      ? ((globalThis as { process: { env: Record<string, string | undefined> } }).process.env
          .NUVIO_EDITOR_URL ?? "cursor")
      : "cursor";
  const normalized = file.replace(/\\/g, "/");
  const atLine = line != null ? `:${line}` : "";
  if (scheme === "vscode" || scheme === "cursor") {
    return `${scheme}://file/${normalized}${atLine}`;
  }
  if (scheme.includes("://")) {
    return `${scheme}${normalized}${atLine}`;
  }
  return `${scheme}://file/${normalized}${atLine}`;
}
