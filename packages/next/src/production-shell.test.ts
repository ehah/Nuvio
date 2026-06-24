import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("NuvioNextShell production guard", () => {
  let prevNodeEnv: string | undefined;

  afterEach(() => {
    if (prevNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it("returns null in production (no active overlay)", async () => {
    prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const { NuvioNextShell } = await import("@nuvio/overlay/next");
    expect(renderToStaticMarkup(createElement(NuvioNextShell))).toBe("");
  });

  it("defers render until client mount in development", async () => {
    prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const { NuvioNextShell } = await import("@nuvio/overlay/next");
    expect(renderToStaticMarkup(createElement(NuvioNextShell))).toBe("");
  });
});
