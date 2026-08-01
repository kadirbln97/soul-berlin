import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/format";
import { getTotalRevenue } from "@/lib/revenue";
import { RevenueSummaryCard } from "@/components/RevenueSummaryCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [events, revenue] = await Promise.all([
    prisma.event.findMany({
      orderBy: { dateStart: "desc" },
      include: {
        _count: {
          select: { tickets: { where: { status: { in: ["VALID", "CHECKED_IN"] } } } }
        }
      }
    }),
    getTotalRevenue()
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
        <RevenueSummaryCard summary={revenue} title="Umsatz gesamt (alle Events)" />
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
                <tr key={event.id} className="border-t border-paper/10">
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
