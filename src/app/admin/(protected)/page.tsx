import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCompactDate, formatEventDate } from "@/lib/format";
import { getEventRevenue, getTotalRevenue } from "@/lib/revenue";
import { RevenueSummaryCard } from "@/components/RevenueSummaryCard";
import { EventScopePicker } from "@/components/EventScopePicker";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: selectedId } = await searchParams;

  const events = await prisma.event.findMany({
    orderBy: { dateStart: "desc" },
    include: {
      _count: {
        select: { tickets: { where: { status: { in: ["VALID", "CHECKED_IN"] } } } }
      }
    }
  });

  // Unbekannte oder gelöschte Event-IDs in der Adresse fallen still auf die
  // Gesamtansicht zurück, statt eine leere Karte zu zeigen.
  const selectedEvent = selectedId ? events.find((e) => e.id === selectedId) : undefined;
  const revenue = selectedEvent
    ? await getEventRevenue(selectedEvent.id)
    : await getTotalRevenue();

  // Newsletter-Zahlen: bewusst getrennt nach Rechtsgrundlage, weil davon
  // abhängt, was verschickt werden darf.
  const [mitEinwilligung, bestandskunden, offen] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE", source: "CONSENT" } }),
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE", source: "CUSTOMER" } }),
    prisma.newsletterSubscriber.count({ where: { status: "PENDING" } })
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-2xl uppercase text-paper sm:text-3xl">Events</h1>
        <Link href="/admin/events/new" className="btn-primary">
          + Neues Event
        </Link>
      </div>

      <div className="mb-8">
        <RevenueSummaryCard
          summary={revenue}
          title={selectedEvent ? "Umsatz & Anmeldungen" : "Umsatz & Anmeldungen (alle Events)"}
          action={
            <EventScopePicker
              value={selectedEvent?.id ?? ""}
              options={events.map((e) => ({
                id: e.id,
                label: `${e.title} · ${formatCompactDate(e.dateStart)}`
              }))}
            />
          }
        />
      </div>

      <div className="mb-8 rounded-2xl card-border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-paper/40">
            Newsletter-Verteiler
          </h2>
          {mitEinwilligung + bestandskunden > 0 && (
            <a
              href="/api/admin/newsletter/export"
              className="text-xs font-semibold uppercase tracking-widest text-paper/60 hover:text-soul-orange"
            >
              Als CSV exportieren ↓
            </a>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-x-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-paper/60">
              Einwilligung
            </dt>
            <dd className="text-display mt-2 text-3xl leading-none text-paper">
              {mitEinwilligung}
            </dd>
            <p className="mt-2 text-[10px] leading-snug text-paper/50">bestätigt per Klick</p>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-paper/60">
              Bestandskunden
            </dt>
            <dd className="text-display mt-2 text-3xl leading-none text-paper">
              {bestandskunden}
            </dd>
            <p className="mt-2 text-[10px] leading-snug text-paper/50">aus Ticketkäufen</p>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-paper/60">
              Offen
            </dt>
            <dd className="text-display mt-2 text-3xl leading-none text-paper/50">{offen}</dd>
            <p className="mt-2 text-[10px] leading-snug text-paper/50">Bestätigung fehlt</p>
          </div>
        </dl>

        {/* Der Unterschied ist kein Detail: Bestandskunden dürfen nur Werbung
            für eigene ähnliche Veranstaltungen bekommen. Wer das vermischt,
            verliert die Grundlage für den gesamten Verteiler. */}
        <p className="mt-4 border-t border-paper/10 pt-4 text-[11px] leading-snug text-paper/40">
          „Offen" bedeutet: angemeldet, aber der Bestätigungslink wurde noch nicht
          geklickt — diese Adressen dürfen nicht angeschrieben werden und sind im
          Export nicht enthalten. Bestandskunden dürfen ausschließlich Ankündigungen
          zu eigenen, ähnlichen Veranstaltungen erhalten. Jede E-Mail braucht einen
          Abmeldelink; er steht in der letzten Spalte des Exports.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="rounded-2xl card-border p-10 text-center text-paper/50">
          Noch keine Events angelegt.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl card-border">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-paper/50">
              <tr>
                <th className="px-5 py-3">Titel</th>
                <th className="px-5 py-3">Datum</th>
                <th className="px-5 py-3">Modus</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Gäste</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  // Das oben ausgewählte Event wird hier hervorgehoben, damit
                  // klar ist, worauf sich die Zahlen in der Karte beziehen.
                  className={`border-t border-paper/10 ${
                    event.id === selectedEvent?.id ? "bg-soul-orange/10" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-medium text-paper">{event.title}</td>
                  <td className="px-5 py-4 text-paper/60">{formatEventDate(event.dateStart)}</td>
                  <td className="px-5 py-4 text-paper/60">
                    {event.ticketMode === "PAID"
                      ? "Bezahlt"
                      : event.ticketMode === "BOTH"
                        ? "Ticket + Gästeliste"
                        : "Gästeliste"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${
                        event.status === "PUBLISHED"
                          ? "bg-soul-orange/20 text-soul-orange"
                          : "bg-paper/10 text-paper/50"
                      }`}
                    >
                      {event.status === "PUBLISHED" ? "Live" : "Entwurf"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-paper/60">
                    {event._count.tickets}
                    {event.capacity ? ` / ${event.capacity}` : ""}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-xs font-semibold uppercase tracking-widest text-soul-orange hover:underline"
                    >
                      Verwalten →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="border-t border-paper/10 px-5 py-2 text-[11px] text-paper/30 sm:hidden">
            Tabelle nach links/rechts wischen, um alle Spalten zu sehen.
          </p>
        </div>
      )}
    </div>
  );
}
