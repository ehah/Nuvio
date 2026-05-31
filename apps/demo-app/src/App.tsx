import type { ReactElement } from "react";
import { NuvioDevShell } from "@nuvio/overlay";
export default function App(): ReactElement {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-xl space-y-16 px-6 py-20">
        <section className="space-y-3" data-nuvio-id="demo.hero.section">
          <h1
            className="text-3xl tracking-tight font-bold"
            data-nuvio-id="demo.hero.title"
          >
            Nuvio
          </h1>
          <p
            className="leading-relaxed text-slate-400"
            data-nuvio-id="demo.hero.lead"
          >
            Click any element, pick what you want to change, then{" "}
            <strong className="font-medium text-slate-300">Preview Changes</strong> and{" "}
            <strong className="font-medium text-slate-300">Apply to Code</strong> — no
            React or Tailwind knowledge required.
          </p>
        </section>

        <section className="space-y-4">
          <h2
            className="text-base font-bold text-slate-300"
            data-nuvio-id="demo.section.features.title"
          >
            Feature cards
          </h2>
          <div
            className="flex flex-col gap-3 sm:flex-row"
            data-nuvio-id="demo.features.row"
          >
            <div
              className="flex-1 rounded-lg border border-slate-800 p-4 bg-slate-900 m-4"
              data-nuvio-id="demo.features.card.fast"
            >
              Fast edits
            </div>
            <div
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900/50 p-4 m-4"
              data-nuvio-id="demo.features.card.stable"
            >
              Stable patches
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-medium rounded-md text-slate-200"
            data-nuvio-id="demo.section.pricing.title"
          >
            Try a button
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-white hover:bg-sky-500 rounded-xl p-2 bg-fuchsia-400"
            data-nuvio-id="demo.pricing.cta"
          >
            Get started
          </button>
        </section>

        <footer className="border-t border-slate-800 pt-8">
          <p
            className="text-xs text-slate-500 text-left"
            data-nuvio-id="demo.footer.note"
          >
            Reference demo — open the Nuvio panel and edit without touching your editor.
          </p>
        </footer>
      </main>
      <NuvioDevShell />
    </div>
  );
}
