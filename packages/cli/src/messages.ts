export const MSG = {
  noPackageJson:
    "Run this from your app folder (the one with package.json).",
  noVite:
    "Nuvio works with React + Vite projects. I couldn't find a Vite config here.",
  noReact: "Nuvio needs React. Add react to this project first.",
  noViteDep: "Nuvio needs Vite. Add vite to this project first.",
  strictTailwind:
    "Nuvio expects Tailwind CSS for class edits. Install tailwindcss or pass --skip-tailwind-check.",
  monorepoRoot:
    "This looks like the Nuvio monorepo. Run init in your app folder, not the tooling repo.",
  cliPackage: "Cannot init inside @nuvio/cli package.",
  partialHelp:
    "Nuvio set up what it could safely. Finish the steps in nuvio/SETUP_TODO.md, then run your dev server.",
  noHeading:
    'Nuvio is wired, but I could not find a heading to mark editable. Add data-nuvio-id="page.title" to one visible element (see nuvio/START_HERE.md).',
} as const;
