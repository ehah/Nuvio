export type ResultTier = "full" | "partial" | "failed";

export type InitPlan = {
  root: string;
  pm: string;
  pmRun: string;
  installCommand: string;
  modify: string[];
  create: string[];
  warnings: string[];
  tier: ResultTier;
  failedSteps: string[];
};

export function createPlan(root: string, pm: string): InitPlan {
  const pmRun =
    pm === "pnpm"
      ? "pnpm dev"
      : pm === "yarn"
        ? "yarn dev"
        : pm === "bun"
          ? "bun run dev"
          : "npm run dev";

  return {
    root,
    pm,
    pmRun,
    installCommand: "",
    modify: [],
    create: [],
    warnings: [],
    tier: "full",
    failedSteps: [],
  };
}
