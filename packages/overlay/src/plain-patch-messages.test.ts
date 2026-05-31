import { describe, expect, it } from "vitest";
import { mapReasonToPlainMessage, formatPatchUserMessagePlain, getPlainPatchAction } from "./plain-patch-messages.js";

const REASONS: ReadonlyArray<{ raw: string; action: string; fragment: string }> = [
  {
    raw: "className is not a string literal — only literal className strings are patchable",
    action: "useHandoff",
    fragment: "dynamic class",
  },
  {
    raw: "Element is inside a .map() — caution",
    action: "switchTarget",
    fragment: "repeated list",
  },
  {
    raw: "Custom React component without className forward",
    action: "useHandoff",
    fragment: "custom component",
  },
  {
    raw: "Text edits apply to leaf elements only",
    action: "switchTarget",
    fragment: "layout container",
  },
  {
    raw: "Responsive dark: classes detected",
    action: "changeBreakpoint",
    fragment: "responsive",
  },
  {
    raw: "duplicate id metric.orders.value",
    action: "addId",
    fragment: "more than once",
  },
  {
    raw: "Id not in the dev source index",
    action: "addId",
    fragment: "wired for editing",
  },
  {
    raw: "Already the first sibling",
    action: "none",
    fragment: "first",
  },
  {
    raw: "Already the last sibling",
    action: "none",
    fragment: "last",
  },
  {
    raw: "No changes to apply",
    action: "none",
    fragment: "Change text",
  },
  {
    raw: "Text cannot be patched on this host",
    action: "switchTarget",
    fragment: "headline",
  },
  {
    raw: "Styles cannot be patched here",
    action: "switchTarget",
    fragment: "Styles aren't",
  },
  {
    raw: "Text and styles target different elements",
    action: "switchTarget",
    fragment: "different parts",
  },
  {
    raw: "host_not_found for selection",
    action: "addId",
    fragment: "find this element",
  },
  {
    raw: "parse_error in source file",
    action: "useHandoff",
    fragment: "couldn't be parsed",
  },
  {
    raw: "tableData binding required for cell",
    action: "switchTarget",
    fragment: "table data",
  },
];

describe("plain-patch-messages", () => {
  for (const { raw, action, fragment } of REASONS) {
    it(`maps: ${raw.slice(0, 40)}…`, () => {
      const msg = mapReasonToPlainMessage(raw);
      expect(msg.suggestedAction).toBe(action);
      expect(msg.sentence.toLowerCase()).toContain(fragment.toLowerCase().split(" ")[0]!);
    });
  }

  it("strips Error prefix", () => {
    expect(formatPatchUserMessagePlain("Error: Already the first sibling")).toContain("first");
  });

  it("getPlainPatchAction fallback", () => {
    expect(getPlainPatchAction("totally unknown engine message")).toBe("useHandoff");
  });
});
