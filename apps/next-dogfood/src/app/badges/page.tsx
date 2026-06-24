import { BadgeShowcase } from "@/components/BadgeShowcase";

export default function BadgesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1
        data-nuvio-id="badges.page.title"
        className="text-2xl font-semibold text-gray-900"
      >
        Badges
      </h1>
      <p className="text-sm text-gray-600">
        Brand Kit badge category — pill hosts with literal utility classes.
      </p>
      <BadgeShowcase />
    </main>
  );
}
