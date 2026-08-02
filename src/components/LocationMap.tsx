// Server-Komponente: Karte + Routenplaner-Buttons für die Event-Location.
// Nutzt die Google-Maps-"output=embed"-URL, die ohne API-Key funktioniert
// (keine Maps-Embed-API-Kosten/Setup nötig) — reicht für eine einfache
// Standort-Vorschau völlig aus.
import { getTranslations } from "@/lib/serverLocale";

export async function LocationMap({ venue, address }: { venue: string; address?: string | null }) {
  const { t } = await getTranslations();
  const query = address ? `${venue}, ${address}` : venue;
  const encoded = encodeURIComponent(query);

  return (
    <div className="mt-8 flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-paper/50">{t.event.location}</p>
      <div className="overflow-hidden rounded-xl border border-paper/10">
        <iframe
          title={`Karte: ${venue}`}
          src={`https://www.google.com/maps?q=${encoded}&output=embed`}
          width="100%"
          height="220"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
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
