import { describe, expect, it } from "vitest";
import type { IndexWireEntry } from "@nuvio/shared";
import {
  cardTaskControls,
  detectSimpleRouterMode,
  inferCardTask,
  resolveCardContext,
} from "./task-router.js";

const metricCard: IndexWireEntry = {
  id: "metric.orders.card",
  file: "x.tsx",
  line: 1,
  column: 1,
  textEditable: false,
  hasLiteralClassName: true,
  riskLevel: "safe",
};

const metricLabel: IndexWireEntry = {
  id: "metric.orders.label",
  file: "x.tsx",
  line: 2,
  column: 1,
  textEditable: true,
  hasLiteralClassName: true,
  riskLevel: "safe",
};

describe("task-router", () => {
  it("detects card mode", () => {
    const entries = [metricCard, metricLabel];
    expect(detectSimpleRouterMode(metricCard, "metric.orders.card", entries)).toBe("card");
  });

  it("detects button mode for filter controls", () => {
    const filterBtn: IndexWireEntry = {
      id: "orders.filter",
      file: "x.tsx",
      line: 3,
      column: 1,
      textEditable: true,
      hierarchyRole: "button",
      riskLevel: "safe",
    };
    expect(detectSimpleRouterMode(filterBtn, "orders.filter", [filterBtn])).toBe("button");
  });

  it("detects form mode", () => {
    const label: IndexWireEntry = {
      id: "form.email.label",
      file: "x.tsx",
      line: 4,
      column: 1,
      textEditable: true,
      riskLevel: "safe",
    };
    expect(detectSimpleRouterMode(label, "form.email.label", [label])).toBe("form");
  });

  it("detects nav mode", () => {
    const nav: IndexWireEntry = {
      id: "nav.dashboard",
      file: "x.tsx",
      line: 5,
      column: 1,
      textEditable: true,
      riskLevel: "safe",
    };
    expect(detectSimpleRouterMode(nav, "nav.dashboard", [nav])).toBe("nav");
  });

  it("detects section mode for page titles", () => {
    const title: IndexWireEntry = {
      id: "dashboard.title",
      file: "x.tsx",
      line: 6,
      column: 1,
      textEditable: true,
      riskLevel: "safe",
    };
    expect(detectSimpleRouterMode(title, "dashboard.title", [title])).toBe("section");
  });

  it("infers label task from selection", () => {
    expect(inferCardTask("metric.orders.label", "metric.orders.card")).toBe("label");
  });

  it("card style task shows background controls", () => {
    const c = cardTaskControls("cardStyle");
    expect(c.showBackground).toBe(true);
    expect(c.showText).toBe(false);
  });

  it("resolveCardContext finds prefix", () => {
    const ctx = resolveCardContext("metric.orders.label", [metricCard, metricLabel]);
    expect(ctx?.prefix).toBe("metric.orders");
  });
});
