import type { AppContext } from "./app-context.js";
import type { InitOptions } from "./init.js";
import { runInitNext } from "./init-next.js";
import {
  verifyNextProject,
  type NextVerification,
} from "./verify-next.js";

export type FrameworkAdapter = {
  id: string;
  init: (opts: InitOptions, app: AppContext) => Promise<number>;
  verify: (root: string, app: AppContext) => NextVerification;
};

export const nextFrameworkAdapter: FrameworkAdapter = {
  id: "next",
  init: runInitNext,
  verify: (root, app) =>
    verifyNextProject(root, app.packageJsonPath, app.router),
};
