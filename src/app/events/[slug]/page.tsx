import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { prisma } from "@/lib/prisma";
import { countActiveTickets } from "@/lib/createTicket";
import { formatEventDate, formatEventTime, formatPrice } from "@/lib/format";
import { getCurrentGuestlistPrice } from "@/lib/guestlistTiers";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="relative mb-8 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-900">
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
                      <span>bis {formatEventTime(tier.untilTime)} Uhr</span>
                      <span className="font-semibold">
                        {formatPrice(tier.priceCents, event.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {spotsLeft !== null && !isSoldOut && spotsLeft <= 20 && (
              <p className="mb-4 text-xs uppercase tracking-widest text-soul-orange">
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
              <SignupForm eventId={event.id} ticketMode={event.ticketMode} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
