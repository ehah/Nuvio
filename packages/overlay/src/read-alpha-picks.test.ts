import { describe, expect, it } from "vitest";
import { readAlphaPicksFromClassName } from "./read-alpha-picks.js";

describe("readAlphaPicksFromClassName", () => {
  it("reads typography and spacing from a typical card class string", () => {
    const picks = readAlphaPicksFromClassName(
      "flex-1 rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400",
    );
    expect(picks.rounded).toBe("rounded-lg");
    expect(picks.padding).toBe("p-4");
    expect(picks.fontSize).toBe("text-sm");
    expect(picks.textColor).toBe("text-slate-400");
    expect(picks.bgColor).toBe("bg-slate-900/50");
  });

  it("does not confuse text-sm with text color", () => {
    const picks = readAlphaPicksFromClassName("text-sm text-white");
    expect(picks.fontSize).toBe("text-sm");
    expect(picks.textColor).toBe("text-white");
  });

  it("reads composite padding option", () => {
    const picks = readAlphaPicksFromClassName("px-4 py-2 rounded-md");
    expect(picks.padding).toBe("px-4 py-2");
    expect(picks.rounded).toBe("rounded-md");
  });

  it("returns empty picks for empty class", () => {
    expect(readAlphaPicksFromClassName("").fontSize).toBe("");
  });

  it("reads responsive and variant-prefixed colors at active breakpoint", () => {
    const atXl = readAlphaPicksFromClassName(
      "rounded-2xl border border-gray-200 bg-white xl:bg-red-100 dark:bg-white/[0.03]",
      "xl",
    );
    expect(atXl.bgColor).toBe("bg-red-100");
    expect(atXl.rounded).toBe("rounded-2xl");
    expect(atXl.borderColor).toBe("border-gray-200");

    const atBase = readAlphaPicksFromClassName(
      "rounded-2xl border border-gray-200 bg-white xl:bg-red-100",
      "base",
    );
    expect(atBase.bgColor).toBe("bg-white");
  });

  it("reads custom text size and palette colors not in static allowlists", () => {
    const picks = readAlphaPicksFromClassName(
      "mt-2 font-bold text-title-sm xl:text-red-600 text-lime-500",
      "xl",
    );
    expect(picks.fontWeight).toBe("font-bold");
    expect(picks.fontSize).toBe("text-title-sm");
    expect(picks.textColor).toBe("text-red-600");
  });

  it("reads Step 6 layout/typography/visual picks", () => {
    const picks = readAlphaPicksFromClassName(
      "flex-col justify-between items-center grid-cols-3 leading-snug tracking-wide border-2 border-slate-700 ring-2 ring-sky-500 px-6 py-4 my-2",
    );
    expect(picks.flexDirection).toBe("flex-col");
    expect(picks.justify).toBe("justify-between");
    expect(picks.items).toBe("items-center");
    expect(picks.gridCols).toBe("grid-cols-3");
    expect(picks.lineHeight).toBe("leading-snug");
    expect(picks.letterSpacing).toBe("tracking-wide");
    expect(picks.borderWidth).toBe("border-2");
    expect(picks.borderColor).toBe("border-slate-700");
    expect(picks.ringWidth).toBe("ring-2");
    expect(picks.ringColor).toBe("ring-sky-500");
    expect(picks.paddingX).toBe("px-6");
    expect(picks.paddingY).toBe("py-4");
    expect(picks.marginY).toBe("my-2");
  });
});
