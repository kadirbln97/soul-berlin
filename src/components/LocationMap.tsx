// Server-Komponente: Routenplaner-Buttons für die Event-Location.
// Ohne eingebettete Karte — nur die Links zu Google Maps und Apple Maps,
// die direkt in der jeweiligen App die Route öffnen.
import { getTranslations } from "@/lib/serverLocale";

export async function LocationMap({ venue, address }: { venue: string; address?: string | null }) {
  const { t } = await getTranslations();
  const query = address ? `${venue}, ${address}` : venue;
  const encoded = encodeURIComponent(query);

  return (
    <div className="mt-8 flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-paper/70">{t.event.location}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encoded}`}
          target="_blank"
          rel="noreferrer noopener"
          className="btn-outline flex-1 text-center sm:flex-none"
        >
          {t.event.routeGoogle}
        </a>
        <a
          href={`https://maps.apple.com/?daddr=${encoded}`}
          target="_blank"
          rel="noreferrer noopener"
          className="btn-outline flex-1 text-center sm:flex-none"
        >
          {t.event.routeApple}
        </a>
      </div>
    </div>
  );
}
