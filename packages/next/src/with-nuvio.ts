import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

function resolveJsxLocLoaderPath(): string {
  const dir =
    typeof __dirname !== "undefined"
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url));
  return path.join(dir, "jsx-loc-loader.cjs");
}

const LOADER_PATH = resolveJsxLocLoaderPath();

export type WithNuvioOptions = {
  /** Project root for relative loc paths (defaults to Next `dir`). */
  projectRoot?: string;
};

/**
 * Wrap Next config with a dev-only webpack rule that injects `data-nuvio-loc` for click-to-tag.
 * No-op in production builds. Disable with `NUVIO=0`.
 */
export function withNuvio(
  config: NextConfig = {},
  options?: WithNuvioOptions,
): NextConfig {
  const userWebpack = config.webpack;

  return {
    ...config,
    transpilePackages: [
      ...(Array.isArray(config.transpilePackages) ? config.transpilePackages : []),
      "@nuvio/overlay",
    ],
    webpack(webpackConfig, ctx) {
      let nextConfig =
        typeof userWebpack === "function" ? userWebpack(webpackConfig, ctx) : webpackConfig;

      if (ctx.dev && process.env.NUVIO !== "0") {
        const projectRoot = options?.projectRoot ?? ctx.dir;
        nextConfig = { ...nextConfig };
        nextConfig.module = { ...nextConfig.module };
        nextConfig.module.rules = [...(nextConfig.module.rules ?? [])];
        nextConfig.module.rules.push({
          test: /\.(tsx|jsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: LOADER_PATH,
              options: { projectRoot },
            },
          ],
        });
      }

      return nextConfig;
    },
  };
}
