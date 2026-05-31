import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  applyPatchToSource,
  mergeAtBreakpoint,
  parseClassNameByBreakpoint,
} from "./apply-patch.js";
import { validateTailwindFragment } from "./tailwind-whitelist.js";

describe("validateTailwindFragment", () => {
  it("allows rounded utilities", () => {
    expect(() => validateTailwindFragment("rounded-md rounded-lg")).not.toThrow();
  });

  it("allows spacing and text utilities", () => {
    expect(() => validateTailwindFragment("p-4 text-sm")).not.toThrow();
  });

  it("allows text-white / text-black (no scale suffix)", () => {
    expect(() => validateTailwindFragment("text-white")).not.toThrow();
    expect(() => validateTailwindFragment("text-black bg-white")).not.toThrow();
  });

  it("allows text-white after stripping zero-width / unicode hyphen noise", () => {
    expect(() => validateTailwindFragment("text\u200B-white")).not.toThrow();
    expect(() => validateTailwindFragment("text\u2011white")).not.toThrow();
  });

  it("rejects unknown utilities", () => {
    expect(() => validateTailwindFragment("wobble-99")).toThrow(/Unknown/);
  });

  it("allows Phase 4 layout and effect utilities", () => {
    expect(() =>
      validateTailwindFragment(
        "text-center gap-4 w-full max-w-md h-12 min-h-0 opacity-75 shadow-lg",
      ),
    ).not.toThrow();
  });

  it("allows Step 6 depth utilities", () => {
    expect(() =>
      validateTailwindFragment(
        "px-6 my-4 flex-col justify-between items-center grid-cols-3 leading-snug tracking-wide border-2 border-slate-700 ring-2 ring-sky-500",
      ),
    ).not.toThrow();
  });

  it("allows width fractions", () => {
    expect(() => validateTailwindFragment("w-1/2 w-2/3")).not.toThrow();
  });
});

describe("applyPatchToSource", () => {
  const fixture = (name: string): string =>
    fs.readFileSync(path.resolve(process.cwd(), "fixtures", name), "utf8");

  it("golden: v04 setTableDataField updates tableData row name", async () => {
    const src = fixture("v04-recent-orders-table-data.tsx");
    const r = await applyPatchToSource(src, "/proj/v04-recent-orders-table-data.tsx", "orders.row.1.nameText", [
      {
        kind: "setTableDataField",
        arrayName: "tableData",
        rowKey: "1",
        field: "name",
        value: "MacBook Pro 14”",
      },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/MacBook Pro 14/);
      expect(r.source).not.toMatch(/MacBook Pro 13/);
    }
  });

  it("golden: simple setText on a single JSXText child", async () => {
    const src = `
export function X() {
  return <div data-nuvio-id="hero.title">Hi</div>;
}
`;
    const r = await applyPatchToSource(src, "/proj/X.tsx", "hero.title", [
      { kind: "setText", text: "Hello" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toContain("Hello");
      expect(r.source).not.toContain(">Hi<");
    }
  });

  it("golden: mergeTailwindClassName uses tailwind-merge (p-4 + p-6 → p-6)", async () => {
    const src = `export const _ = () => <div data-nuvio-id="c" className="p-4 text-sm">x</div>;`;
    const r = await applyPatchToSource(src, "/proj/C.tsx", "c", [
      { kind: "mergeTailwindClassName", classNameFragment: "p-6" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/p-6/);
      expect(r.source).not.toMatch(/p-4/);
    }
  });

  it("golden: mergeTailwindClassName text color + margin", async () => {
    const src = `export const _ = () => <div data-nuvio-id="x" className="text-slate-300 m-2">y</div>;`;
    const r = await applyPatchToSource(src, "/proj/X.tsx", "x", [
      { kind: "mergeTailwindClassName", classNameFragment: "text-sky-400" },
      { kind: "mergeTailwindClassName", classNameFragment: "mt-4" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/text-sky-400/);
      expect(r.source).not.toMatch(/text-slate-300/);
      expect(r.source).toMatch(/mt-4/);
    }
  });

  it("golden: setText plus mergeTailwind in one patch", async () => {
    const src = `export const _ = () => <div data-nuvio-id="btn" className="rounded-md">Go</div>;`;
    const r = await applyPatchToSource(src, "/proj/B.tsx", "btn", [
      { kind: "setText", text: "Ship" },
      { kind: "mergeTailwindClassName", classNameFragment: "rounded-lg" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toContain("Ship");
      expect(r.source).toMatch(/rounded-lg/);
      expect(r.source).not.toMatch(/rounded-md/);
    }
  });

  it("golden: Phase 4 merge text-align max-width shadow", async () => {
    const src = `export const _ = () => <p data-nuvio-id="f" className="text-xs text-slate-500">Note</p>;`;
    const r = await applyPatchToSource(src, "/proj/F.tsx", "f", [
      { kind: "mergeTailwindClassName", classNameFragment: "text-center" },
      { kind: "mergeTailwindClassName", classNameFragment: "max-w-prose" },
      { kind: "mergeTailwindClassName", classNameFragment: "shadow-md" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/text-center/);
      expect(r.source).toMatch(/max-w-prose/);
      expect(r.source).toMatch(/shadow-md/);
    }
  });

  it("rejects unknown id", async () => {
    const src = `export const _ = () => <div data-nuvio-id="a">x</div>;`;
    const r = await applyPatchToSource(src, "/proj/A.tsx", "missing", [
      { kind: "setText", text: "y" },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("host_not_found");
    }
  });

  it("rejects disallowed utilities before merge", async () => {
    const src = `export const _ = () => <div data-nuvio-id="c" className="p-4">x</div>;`;
    const r = await applyPatchToSource(src, "/proj/C.tsx", "c", [
      { kind: "mergeTailwindClassName", classNameFragment: "wobble-99" },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("patch_rejected");
    }
  });

  it("golden: setText replaces rich JSX children with one text node", async () => {
    const src = `export const _ = () => (
  <p data-nuvio-id="lead">
    <strong>A</strong> and <span className="x">B</span>.
  </p>
);`;
    const r = await applyPatchToSource(src, "/proj/L.tsx", "lead", [
      { kind: "setText", text: "Plain copy." },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toContain("Plain copy.");
      expect(r.source).not.toContain("<strong>");
    }
  });

  it("golden: moveSibling down swaps JSX siblings under flex parent", async () => {
    const src = `export const _ = () => (
  <div className="flex gap-2" data-nuvio-id="row">
    <div data-nuvio-id="a">A</div>
    <div data-nuvio-id="b">B</div>
  </div>
);`;
    const r = await applyPatchToSource(src, "/proj/R.tsx", "a", [
      { kind: "moveSibling", direction: "down" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const aPos = r.source.indexOf('data-nuvio-id="a"');
      const bPos = r.source.indexOf('data-nuvio-id="b"');
      expect(aPos).toBeGreaterThan(bPos);
    }
  });

  it("rejects moveSibling when parent is not flex/grid", async () => {
    const src = `export const _ = () => (
  <div>
    <span data-nuvio-id="a">A</span>
    <span data-nuvio-id="b">B</span>
  </div>
);`;
    const r = await applyPatchToSource(src, "/proj/R.tsx", "a", [
      { kind: "moveSibling", direction: "down" },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/flex or grid/i);
    }
  });

  it("golden: setHidden adds hidden utility", async () => {
    const src = `export const _ = () => <div data-nuvio-id="x" className="p-4">x</div>;`;
    const r = await applyPatchToSource(src, "/proj/X.tsx", "x", [
      { kind: "setHidden", hidden: true },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/\bhidden\b/);
    }
  });

  it("golden: setHidden false removes hidden", async () => {
    const src = `export const _ = () => <div data-nuvio-id="x" className="hidden p-4">x</div>;`;
    const r = await applyPatchToSource(src, "/proj/X.tsx", "x", [
      { kind: "setHidden", hidden: false },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).not.toMatch(/\bhidden\b/);
      expect(r.source).toMatch(/p-4/);
    }
  });

  it("golden: duplicateHost remaps descendant data-nuvio-id values", async () => {
    const src = `export const _ = () => (
  <div className="grid">
    <div data-nuvio-id="metric.orders.card" className="rounded-xl p-4">
      <p data-nuvio-id="metric.orders.value" className="text-3xl">5,359</p>
    </div>
  </div>
);`;
    const r = await applyPatchToSource(src, "/proj/Card.tsx", "metric.orders.card", [
      { kind: "duplicateHost" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toContain('data-nuvio-id="metric.orders.card.copy"');
      expect(r.source).toContain('data-nuvio-id="metric.orders.value.copy"');
      expect(r.source.match(/data-nuvio-id="metric.orders.value"/g)?.length).toBe(1);
    }
  });

  it("golden: duplicateHost clones element with new id", async () => {
    const src = `export const _ = () => (
  <div className="flex">
    <button data-nuvio-id="cta">Go</button>
  </div>
);`;
    const r = await applyPatchToSource(src, "/proj/B.tsx", "cta", [{ kind: "duplicateHost" }]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toContain('data-nuvio-id="cta"');
      expect(r.source).toContain('data-nuvio-id="cta.copy"');
      expect(r.diffSummary).toMatch(/cta\.copy/);
    }
  });

  it("rejects non-literal className", async () => {
    const src = `import { cn } from "./u";
export const _ = () => <div data-nuvio-id="c" className={cn("p-4")}>x</div>;`;
    const r = await applyPatchToSource(src, "/proj/C.tsx", "c", [
      { kind: "mergeTailwindClassName", classNameFragment: "p-6" },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/string literal/i);
    }
  });

  it("cn-basic: allows simple cn string-list", async () => {
    const src = `import { cn } from "./u";
export const _ = () => <div data-nuvio-id="c" className={cn("p-4","rounded-md")}>x</div>;`;
    const r = await applyPatchToSource(
      src,
      "/proj/C.tsx",
      "c",
      [{ kind: "mergeTailwindClassName", classNameFragment: "p-6" }],
      { classNameMode: "cn-basic" },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/cn\("rounded-md p-6"\)/);
    }
  });

  it("cn-basic: rejects conditional cn patterns", async () => {
    const src = `import { cn } from "./u";
export const _ = ({ active }: {active:boolean}) => <div data-nuvio-id="c" className={cn("p-4", active && "bg-blue-500")}>x</div>;`;
    const r = await applyPatchToSource(
      src,
      "/proj/C.tsx",
      "c",
      [{ kind: "mergeTailwindClassName", classNameFragment: "p-6" }],
      { classNameMode: "cn-basic" },
    );
    expect(r.ok).toBe(false);
  });

  it("golden fixture: fragment wrapper supports targeted text patch", async () => {
    const src = fixture("v03-fragment-wrapper.tsx");
    const r = await applyPatchToSource(src, "/proj/v03-fragment-wrapper.tsx", "hero.subtitle", [
      { kind: "setText", text: "Updated by fixture test." },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toContain("Updated by fixture test.");
      expect(r.source).toContain('data-nuvio-id="hero.title"');
    }
  });

  it("golden fixture: conditional wrapper supports style patch on host", async () => {
    const src = fixture("v03-conditional-wrapper.tsx");
    const r = await applyPatchToSource(src, "/proj/v03-conditional-wrapper.tsx", "promo.shell", [
      { kind: "mergeTailwindClassName", classNameFragment: "shadow-md" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/shadow-md/);
      expect(r.source).toContain('data-nuvio-id="promo.message"');
    }
  });

  it("golden fixture: map wrapper host can be patched safely", async () => {
    const src = fixture("v03-map-explicit-id.tsx");
    const r = await applyPatchToSource(src, "/proj/v03-map-explicit-id.tsx", "metrics.list", [
      { kind: "mergeTailwindClassName", classNameFragment: "p-6" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/p-6/);
    }
  });

  it("golden fixture: nested metric card routes text and style to explicit ids", async () => {
    const src = fixture("v03-nested-metric-card.tsx");
    const textPatch = await applyPatchToSource(
      src,
      "/proj/v03-nested-metric-card.tsx",
      "metric.revenue.value",
      [{ kind: "setText", text: "$25K" }],
    );
    expect(textPatch.ok).toBe(true);
    if (textPatch.ok) {
      expect(textPatch.source).toContain("$25K");
      const hostPatch = await applyPatchToSource(
        textPatch.source,
        "/proj/v03-nested-metric-card.tsx",
        "metric.revenue.card",
        [{ kind: "mergeTailwindClassName", classNameFragment: "bg-white" }],
      );
      expect(hostPatch.ok).toBe(true);
      if (hostPatch.ok) {
        expect(hostPatch.source).toMatch(/bg-white/);
      }
    }
  });

  it("golden Step 7: typography family merges safely", async () => {
    const src = fixture("v03-nested-metric-card.tsx");
    const r = await applyPatchToSource(src, "/proj/v03-nested-metric-card.tsx", "metric.revenue.value", [
      { kind: "mergeTailwindClassName", classNameFragment: "text-2xl" },
      { kind: "mergeTailwindClassName", classNameFragment: "font-semibold" },
      { kind: "mergeTailwindClassName", classNameFragment: "leading-snug" },
      { kind: "mergeTailwindClassName", classNameFragment: "tracking-wide" },
      { kind: "mergeTailwindClassName", classNameFragment: "text-center" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/text-2xl/);
      expect(r.source).toMatch(/font-semibold/);
      expect(r.source).toMatch(/leading-snug/);
      expect(r.source).toMatch(/tracking-wide/);
      expect(r.source).toMatch(/text-center/);
      expect(r.source).not.toMatch(/text-3xl/);
    }
  });

  it("golden Step 7: spacing family merges safely", async () => {
    const src = fixture("v03-nested-metric-card.tsx");
    const r = await applyPatchToSource(src, "/proj/v03-nested-metric-card.tsx", "metric.revenue.card", [
      { kind: "mergeTailwindClassName", classNameFragment: "p-6" },
      { kind: "mergeTailwindClassName", classNameFragment: "px-8" },
      { kind: "mergeTailwindClassName", classNameFragment: "py-4" },
      { kind: "mergeTailwindClassName", classNameFragment: "my-2" },
      { kind: "mergeTailwindClassName", classNameFragment: "gap-6" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/px-8/);
      expect(r.source).toMatch(/py-4/);
      expect(r.source).toMatch(/my-2/);
      expect(r.source).toMatch(/gap-6/);
      expect(r.source).not.toMatch(/p-4 md:p-6/);
    }
  });

  it("golden Step 7: layout family merges safely", async () => {
    const src = fixture("v03-map-explicit-id.tsx");
    const r = await applyPatchToSource(src, "/proj/v03-map-explicit-id.tsx", "metrics.list", [
      { kind: "mergeTailwindClassName", classNameFragment: "grid-cols-3" },
      { kind: "mergeTailwindClassName", classNameFragment: "justify-between" },
      { kind: "mergeTailwindClassName", classNameFragment: "items-center" },
      { kind: "mergeTailwindClassName", classNameFragment: "max-w-4xl" },
      { kind: "mergeTailwindClassName", classNameFragment: "w-full" },
      { kind: "mergeTailwindClassName", classNameFragment: "h-24" },
      { kind: "mergeTailwindClassName", classNameFragment: "min-h-16" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/grid-cols-3/);
      expect(r.source).toMatch(/justify-between/);
      expect(r.source).toMatch(/items-center/);
      expect(r.source).toMatch(/max-w-4xl/);
      expect(r.source).toMatch(/w-full/);
      expect(r.source).toMatch(/h-24/);
      expect(r.source).toMatch(/min-h-16/);
    }
  });

  it("golden Step 7: visual family merges safely", async () => {
    const src = fixture("v03-conditional-wrapper.tsx");
    const r = await applyPatchToSource(src, "/proj/v03-conditional-wrapper.tsx", "promo.shell", [
      { kind: "mergeTailwindClassName", classNameFragment: "rounded-2xl" },
      { kind: "mergeTailwindClassName", classNameFragment: "border-2" },
      { kind: "mergeTailwindClassName", classNameFragment: "border-slate-700" },
      { kind: "mergeTailwindClassName", classNameFragment: "ring-2" },
      { kind: "mergeTailwindClassName", classNameFragment: "ring-sky-500" },
      { kind: "mergeTailwindClassName", classNameFragment: "opacity-75" },
      { kind: "mergeTailwindClassName", classNameFragment: "shadow-lg" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/rounded-2xl/);
      expect(r.source).toMatch(/border-2/);
      expect(r.source).toMatch(/border-slate-700/);
      expect(r.source).toMatch(/ring-2/);
      expect(r.source).toMatch(/ring-sky-500/);
      expect(r.source).toMatch(/opacity-75/);
      expect(r.source).toMatch(/shadow-lg/);
    }
  });
});

describe("breakpoint class merge helpers", () => {
  it("parses classes into breakpoint buckets", () => {
    const buckets = parseClassNameByBreakpoint("p-4 md:p-6 lg:p-8 hover:bg-red-500");
    expect(buckets.base).toContain("p-4");
    expect(buckets.md).toContain("p-6");
    expect(buckets.lg).toContain("p-8");
    expect(buckets.passthrough).toContain("hover:bg-red-500");
  });

  it("merges only active breakpoint tokens", () => {
    const merged = mergeAtBreakpoint("p-4 md:p-6 lg:p-8", "p-10", "md");
    expect(merged).toContain("p-4");
    expect(merged).toContain("md:p-10");
    expect(merged).toContain("lg:p-8");
    expect(merged).not.toContain("md:p-6");
  });

  it("keeps explicit fragment prefixes", () => {
    const merged = mergeAtBreakpoint("p-4 md:p-6", "lg:p-12", "md");
    expect(merged).toContain("p-4");
    expect(merged).toContain("md:p-6");
    expect(merged).toContain("lg:p-12");
  });
});

describe("applyPatchToSource with activeBreakpoint", () => {
  it("updates only md bucket for responsive className", async () => {
    const src = `export const _ = () => <div data-nuvio-id="card" className="p-4 md:p-6 lg:p-8">x</div>;`;
    const r = await applyPatchToSource(
      src,
      "/proj/Responsive.tsx",
      "card",
      [{ kind: "mergeTailwindClassName", classNameFragment: "p-10" }],
      { activeBreakpoint: "md" },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toMatch(/className="p-4 md:p-10 lg:p-8"/);
    }
  });
});
