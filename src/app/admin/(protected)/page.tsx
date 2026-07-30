import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const events = await prisma.event.findMany({
    orderBy: { dateStart: "desc" },
    include: {
      _count: {
        select: { tickets: { where: { status: { in: ["VALID", "CHECKED_IN"] } } } }
      }
    }
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-display text-3xl uppercase text-paper">Events</h1>
        <Link href="/admin/events/new" className="btn-primary">
          + Neues Event
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="rounded-2xl card-border p-10 text-center text-paper/50">
          Noch keine Events angelegt.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl card-border">
          <table className="w-full text-left text-sm">
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
                    {event.ticketMode === "PAID" ? "Bezahlt" : "Gästeliste"}
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
      )}
    </div>
  );
}
