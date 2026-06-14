import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GUIDE_CONTENT } from "./selection-guides.js";
import { mapSelectOptionsForSimpleMode } from "./simple-option-labels.js";

const overlaySrc = dirname(fileURLToPath(import.meta.url));

/** Rule 0 — must not appear in Simple Mode user-facing copy. */
const FORBIDDEN_SIMPLE_PATTERNS: RegExp[] = [
  /\bdata-nuvio-id\b/i,
  /\bclassName\b/,
  /\bmergeTailwind\b/,
  /\bsetText\b/,
  /\bsetTableDataField\b/,
  /\bdryRun\b/,
  /\bpatchHostId\b/,
  /\btextTarget\b/,
  /\bstyleTarget\b/,
  /\bhierarchyRole\b/,
  /\bunsupportedReason\b/,
  /\bmetric\.orders\./,
  /\borders\.row\.\d+/,
  /\btext-sm\b/,
  /\bfont-medium\b/,
  /\brounded-lg\b/,
  /\bp-4\b/,
];

function readOverlayFile(name: string): string {
  return readFileSync(join(overlaySrc, name), "utf8");
}

describe("Simple Mode visibility audit (Rule 0)", () => {
  it("onboarding guide copy has no engine leaks", () => {
    for (const [id, content] of Object.entries(GUIDE_CONTENT)) {
      const blob = `${content.title}\n${content.body}`;
      for (const pattern of FORBIDDEN_SIMPLE_PATTERNS) {
        expect(pattern.test(blob), `${id} matched ${pattern}`).toBe(false);
      }
    }
  });

  it("simple option labels never expose Tailwind utility tokens", () => {
    const fontSizeOpts = [
      { value: "", label: "—" },
      { value: "text-sm", label: "text-sm" },
      { value: "text-lg", label: "text-lg" },
    ];
    const mapped = mapSelectOptionsForSimpleMode(fontSizeOpts, "fontSize", false);
    for (const opt of mapped) {
      expect(opt.label).not.toMatch(/^text-/);
      expect(opt.label).not.toMatch(/^font-/);
    }
  });

  it("PropertyPanelShell gates developer-only banners behind developerDetails", () => {
    const shell = readOverlayFile("PropertyPanelShell.tsx");
    expect(shell).toContain("displayPreviewError && !structuralPreviewActive && developerDetails");
    expect(shell).toContain("displayPatchBlockedReason && developerDetails");
    expect(shell).toContain("{developerDetails ? (");
    expect(shell).toContain('nuvio-more-styles');
    expect(shell).not.toMatch(/nuvio-device-compact/);
  });

  it("handoff bar hides Open in editor in simple mode", () => {
    const handoff = readOverlayFile("handoff-actions.tsx");
    expect(handoff).toContain("!simpleMode && editorUrl");
  });

  it("ComponentTree friendly mode hides ids and file paths", () => {
    const tree = readOverlayFile("ComponentTree.tsx");
    expect(tree).toContain("!friendlyLabels ?");
    expect(tree).toContain('friendlyLabels ? formatFriendlyId(e.id, e) : e.id');
  });

  it("task router hides sub-menu chrome in simple mode", () => {
    const router = readOverlayFile("task-router.tsx");
    expect(router).toContain("if (simpleMode && activeTask !== \"menu\")");
  });

  it("brand kit panel copy has no engine leaks in user-facing strings", () => {
    const panel = readOverlayFile("brand-kit-panel.tsx");
    const jsxText = [...panel.matchAll(/>([^<>{}\n]+)</g)]
      .map((match) => match[1]!.trim())
      .filter(Boolean)
      .join("\n");
    for (const pattern of FORBIDDEN_SIMPLE_PATTERNS) {
      expect(pattern.test(jsxText), `brand-kit-panel matched ${pattern}`).toBe(false);
    }
    expect(panel).toContain("Save Brand");
    expect(panel).toContain("Apply Brand");
    expect(panel).toContain("Validate");
  });

  it("PropertyPanelShell defaults to Brand Kit when edit mode turns on", () => {
    const shell = readOverlayFile("PropertyPanelShell.tsx");
    expect(shell).toContain('useState<EditorPanelTab>("brand")');
    expect(shell).toContain("if (editMode && !prevEditMode)");
    expect(shell).toContain('setEditorTab("brand")');
  });

  it("brand kit first-run checklist uses plain-language steps", () => {
    const checklist = readOverlayFile("brand-kit-first-run.tsx");
    const jsxText = [...checklist.matchAll(/>([^<>{}\n]+)</g)]
      .map((match) => match[1]!.trim())
      .filter(Boolean)
      .join("\n");
    expect(jsxText).toContain("Validate");
    expect(jsxText).toContain("Apply Brand");
    expect(jsxText).not.toMatch(/dryRun|mergeTailwind/);
  });
});
