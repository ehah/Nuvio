import { describe, expect, it } from "vitest";
import loader from "./jsx-loc-loader.cjs";

type LoaderContext = {
  async: () => (err: Error | null, result?: string) => void;
  getOptions: () => Record<string, unknown>;
  resourcePath: string;
  rootContext: string;
};

function runLoader(
  source: string,
  ctx: Partial<LoaderContext> & { resourcePath: string },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const context: LoaderContext = {
      async: () => (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result ?? source);
      },
      getOptions: () => ({}),
      rootContext: "/proj",
      ...ctx,
    };
    loader.call(context, source);
  });
}

describe("jsx-loc-loader", () => {
  it("passes source through unchanged in production", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const source = `export default () => <p>Hi</p>;`;
    const out = await runLoader(source, {
      resourcePath: "/proj/pages/index.tsx",
    });
    expect(out).toBe(source);
    process.env.NODE_ENV = prev;
  });

  it("injects data-nuvio-loc in development", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const source = `export default function Home() {
  return <p>Subtitle</p>;
}
`;
    const out = await runLoader(source, {
      resourcePath: "/proj/pages/index.tsx",
      getOptions: () => ({ projectRoot: "/proj" }),
    });
    expect(out).toContain('data-nuvio-loc="pages/index.tsx:');
    process.env.NODE_ENV = prev;
  });
});
