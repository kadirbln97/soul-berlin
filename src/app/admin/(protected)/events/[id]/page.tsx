import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/EventForm";
import { GuestTable } from "@/components/GuestTable";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { RevenueSummaryCard } from "@/components/RevenueSummaryCard";
import { getEventRevenue } from "@/lib/revenue";
import { DiscountManager } from "@/components/DiscountManager";
import { ManualGuestForm } from "@/components/ManualGuestForm";

export const dynamic = "force-dynamic";

export default async function AdminEventDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { guestlistTiers: { orderBy: { untilTime: "asc" } } }
  });
  if (!event) notFound();

  const [tickets, revenue, discounts] = await Promise.all([
    prisma.ticket.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" }
    }),
    getEventRevenue(event.id),
    prisma.discount.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-display text-2xl uppercase text-paper sm:text-3xl">{event.title}</h1>
          <div className="flex items-center gap-4">
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              className="text-xs font-semibold uppercase tracking-widest text-paper/60 hover:text-soul-orange"
            >
              Live ansehen ↗
            </Link>
            <DeleteEventButton eventId={event.id} />
          </div>
        </div>
        <div className="max-w-3xl rounded-2xl card-border bg-white/[0.02] p-6">
          <EventForm
            initial={{
              id: event.id,
              title: event.title,
              subtitle: event.subtitle,
              description: event.description,
              titleEn: event.titleEn,
              subtitleEn: event.subtitleEn,
              descriptionEn: event.descriptionEn,
              venue: event.venue,
              address: event.address,
              imageUrl: event.imageUrl,
              imageIsAi: event.imageIsAi,
              dateStart: event.dateStart.toISOString(),
              dateEnd: event.dateEnd ? event.dateEnd.toISOString() : null,
              ticketMode: event.ticketMode,
              priceCents: event.priceCents,
              capacity: event.capacity,
              ticketSalesEndAt: event.ticketSalesEndAt ? event.ticketSalesEndAt.toISOString() : null,
              status: event.status,
              guestlistTiers: event.guestlistTiers.map((tier) => ({
                untilTime: tier.untilTime.toISOString(),
                priceCents: tier.priceCents,
                label: tier.label
              }))
            }}
          />
        </div>
      </div>

      <div className="max-w-md">
        <RevenueSummaryCard
          summary={revenue}
          currency={event.currency}
          title="Umsatz & Anmeldungen (dieses Event)"
        />
      </div>

      <div>
        <div className="mb-6">
          <h2 className="text-display text-xl uppercase text-paper sm:text-2xl">
            Rabatte & Aktionen
          </h2>
          <p className="mt-1 text-sm text-paper/50">
            Gutscheincodes oder ein Rabatt für alle. Gilt nur für den Online-Ticketkauf.
          </p>
        </div>
        <DiscountManager
          eventId={event.id}
          currency={event.currency}
          initialDiscounts={discounts.map((d) => ({
            id: d.id,
            code: d.code,
            type: d.type,
            value: d.value,
            label: d.label,
            active: d.active,
            maxUses: d.maxUses,
            usedCount: d.usedCount
          }))}
        />
      </div>

      <div>
        <div className="mb-6">
          <h2 className="text-display text-xl uppercase text-paper sm:text-2xl">
            Gäste manuell eintragen
          </h2>
          <p className="mt-1 text-sm text-paper/50">
            Für Namenslisten von Promotern. Suche und Check-in laufen an der Tür über den
            Scanner.
          </p>
        </div>
        <ManualGuestForm eventId={event.id} />
      </div>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-display text-xl uppercase text-paper sm:text-2xl">
            Gästeliste / Tickets ({tickets.length})
          </h2>
          <a
            href={`/api/admin/events/${event.id}/export`}
            className="text-xs font-semibold uppercase tracking-widest text-paper/60 hover:text-soul-orange"
          >
            Als Excel exportieren ↓
          </a>
        </div>
        <GuestTable
          tickets={tickets.map((t) => ({
            id: t.id,
            name: t.name,
            email: t.email,
            phone: t.phone,
            status: t.status,
            amountCents: t.amountCents,
            tierLabel: t.tierLabel,
            currency: t.currency,
            isPaidOnline: Boolean(t.stripePaymentIntentId),
            partySize: t.partySize,
            checkedInAt: t.checkedInAt ? t.checkedInAt.toISOString() : null,
            createdAt: t.createdAt.toISOString()
          }))}
        />
      </div>
    </div>
  );
}
