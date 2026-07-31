import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { TicketAvailabilityGate } from "@/components/TicketAvailabilityGate";
import { LocationMap } from "@/components/LocationMap";
import { prisma } from "@/lib/prisma";
import { countActiveTickets } from "@/lib/createTicket";
import { formatEventDate, formatEventTime, formatPrice } from "@/lib/format";
import { getCurrentGuestlistPrice } from "@/lib/guestlistTiers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });

  if (!event || event.status !== "PUBLISHED") {
    return { title: "Event nicht gefunden" };
  }

  const title = event.subtitle ? `${event.title} — ${event.subtitle}` : event.title;
  const description = event.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/events/${event.slug}`,
      images: event.imageUrl ? [{ url: event.imageUrl, width: 1200, height: 1500 }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: event.imageUrl ? [event.imageUrl] : undefined
    }
  };
}

export default async function EventDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: { guestlistTiers: { orderBy: { untilTime: "asc" } } }
  });

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const guestlistPrice = getCurrentGuestlistPrice(event.guestlistTiers);

  const activeTickets = await countActiveTickets(event.id);
  const isSoldOut = event.capacity ? activeTickets >= event.capacity : false;
  const spotsLeft = event.capacity ? Math.max(event.capacity - activeTickets, 0) : null;
  const salesEndAtIso = event.ticketSalesEndAt ? event.ticketSalesEndAt.toISOString() : null;
  const salesClosed = event.ticketSalesEndAt ? new Date() > event.ticketSalesEndAt : false;

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {/* Gleiches Seitenverhältnis (4:5) wie die Event-Card auf der Startseite/Übersicht,
              damit ein hochgeladenes Bild überall im selben Ausschnitt gut aussieht. */}
          <div className="relative mb-8 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900">
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-display text-6xl italic-skew text-paper/20">
                SØUL
              </div>
            )}
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-soul-orange">
            {formatEventDate(event.dateStart)}
          </p>
          <h1 className="text-display mt-2 text-4xl uppercase leading-none text-paper sm:text-5xl">
            {event.title}
          </h1>
          {event.subtitle && (
            <p className="mt-3 text-lg text-paper/70">{event.subtitle}</p>
          )}
          <p className="mt-4 text-sm uppercase tracking-widest text-paper/50">
            {event.venue}
            {event.address ? ` · ${event.address}` : ""}
          </p>

          <div className="mt-8 whitespace-pre-line text-paper/80 leading-relaxed">
            {event.description}
          </div>

          <LocationMap venue={event.venue} address={event.address} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl card-border bg-white/[0.02] p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-paper/50">
                {event.ticketMode === "PAID" ? "Ticket" : "Gästeliste"}
              </span>
              <span className="text-display text-xl text-soul-orange">
                {event.ticketMode === "PAID" && event.priceCents
                  ? formatPrice(event.priceCents, event.currency)
                  : guestlistPrice
                    ? formatPrice(guestlistPrice, event.currency)
                    : "Free"}
              </span>
            </div>

            {event.ticketMode === "GUESTLIST" && event.guestlistTiers.length > 0 && (
              <div className="mb-6 flex flex-col gap-1.5 rounded-xl border border-paper/10 p-4">
                <p className="mb-1 text-[11px] uppercase tracking-widest text-paper/40">
                  Preisstaffeln (Zahlung an der Abendkasse)
                </p>
                {event.guestlistTiers.map((tier) => {
                  const isActive = tier.priceCents === guestlistPrice;
                  return (
                    <div
                      key={tier.id}
                      className={`flex items-center justify-between text-sm ${
                        isActive ? "text-soul-orange" : "text-paper/60"
                      }`}
                    >
                      <span>
                        {tier.label ? `${tier.label} — ` : ""}
                        bis {formatEventTime(tier.untilTime)} Uhr
                      </span>
                      <span className="font-semibold">
                        {formatPrice(tier.priceCents, event.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {spotsLeft !== null && !isSoldOut && spotsLeft <= 20 && (
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-soul-orange">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-soul-orange" />
                Nur noch {spotsLeft} Plätze
              </p>
            )}

            {isSoldOut ? (
              <div className="rounded-xl border border-paper/15 p-6 text-center">
                <p className="text-display text-lg uppercase text-paper/60">Sold out</p>
                <p className="mt-2 text-sm text-paper/40">
                  Dieses Event ist leider ausgebucht.
                </p>
              </div>
            ) : (
              <TicketAvailabilityGate ticketSalesEndAt={salesEndAtIso} initiallyClosed={salesClosed}>
                <SignupForm eventId={event.id} ticketMode={event.ticketMode} />
                {event.ticketMode === "PAID" && (
                  <p className="mt-4 text-center text-[11px] text-paper/40">
                    Sichere Zahlung via Karte, Apple&nbsp;Pay, Google&nbsp;Pay oder PayPal
                    (abgewickelt von Stripe).
                  </p>
                )}
              </TicketAvailabilityGate>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
