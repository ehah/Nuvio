import { describe, expect, it } from "vitest";
import type { IndexWireEntry, TextWireTarget } from "@nuvio/shared";
import { ContainerGuidance } from "./container-guidance.js";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

describe("ContainerGuidance", () => {
  const entry: IndexWireEntry = {
    id: "hero.section",
    file: "Home.tsx",
    line: 10,
    column: 1,
    textEditable: false,
  };

  const textTargets: TextWireTarget[] = [
    {
      key: "title",
      label: "Welcome",
      file: "Home.tsx",
      line: 12,
      column: 1,
      tagName: "h1",
      textEditable: true,
      textPreview: "Welcome",
      nuvioId: "hero.title",
      patchHostId: "hero.title",
    },
  ];

  it("renders plain guidance in simple mode", () => {
    const html = renderToStaticMarkup(
      createElement(ContainerGuidance, {
        entry,
        selectedId: entry.id,
        textTargets,
        indexEntries: [entry, { ...entry, id: "hero.title", textEditable: true }],
        developerDetails: false,
        taskRouterActive: false,
        onSwitchToTarget: () => {},
        onSelectId: () => {},
      }),
    );
    expect(html).toContain("This area has editable parts");
    expect(html).toContain("Edit title");
  });

  it("returns null when task router is active", () => {
    const html = renderToStaticMarkup(
      createElement(ContainerGuidance, {
        entry,
        selectedId: entry.id,
        textTargets,
        indexEntries: [entry],
        developerDetails: false,
        taskRouterActive: true,
        onSwitchToTarget: () => {},
        onSelectId: () => {},
      }),
    );
    expect(html).toBe("");
  });

  it("returns null when text is editable on host", () => {
    const html = renderToStaticMarkup(
      createElement(ContainerGuidance, {
        entry: { ...entry, textEditable: true },
        selectedId: entry.id,
        textTargets,
        indexEntries: [entry],
        developerDetails: false,
        taskRouterActive: false,
        onSwitchToTarget: () => {},
        onSelectId: () => {},
      }),
    );
    expect(html).toBe("");
  });
});
