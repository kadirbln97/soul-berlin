import { getSiteContent } from "@/lib/siteContent";
import { HomepageEditor } from "@/components/HomepageEditor";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const content = await getSiteContent();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-display text-2xl uppercase text-paper sm:text-3xl">Startseite</h1>
        <p className="mt-1 text-sm text-paper/50">
          Überschriften, Buttons und Bilder der öffentlichen Startseite anpassen. Rechts siehst
          du sofort, wie es für Gäste aussieht.
        </p>
      </div>

      <HomepageEditor initialValues={content} />
    </div>
  );
}
