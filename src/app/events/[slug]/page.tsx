import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TicketPurchasePanel } from "@/components/TicketPurchasePanel";
import { LocationMap } from "@/components/LocationMap";
import { AiBadge } from "@/components/AiBadge";
import { prisma } from "@/lib/prisma";
import { countActiveTickets } from "@/lib/createTicket";
import { formatEventDate } from "@/lib/format";
import { getCurrentGuestlistPrice } from "@/lib/guestlistTiers";
import { resolveDiscount } from "@/lib/resolveDiscount";
import { getTranslations, pickText } from "@/lib/serverLocale";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });

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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
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

  // Rabatt, der ohne Code für alle gilt — für die Preisvorschau im Panel.
  const { discount: autoDiscount } = await resolveDiscount(event.id);
  const { locale, t } = await getTranslations();

  const title = pickText(locale, event.title, event.titleEn);
  const subtitle = pickText(locale, event.subtitle ?? "", event.subtitleEn);
  const description = pickText(locale, event.description, event.descriptionEn);

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
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-display text-6xl italic-skew text-paper/40">
                SØUL
              </div>
            )}
            {event.imageUrl && event.imageIsAi && (
              <AiBadge label={t.ai.badge} title={t.ai.imageNotice} />
            )}
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-soul-orange">
            {formatEventDate(event.dateStart)}
          </p>
          <h1 className="text-display mt-2 text-4xl uppercase leading-none text-paper sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-lg text-paper/70">{subtitle}</p>}
          <p className="mt-4 text-sm uppercase tracking-widest text-paper/70">
            {event.venue}
            {event.address ? ` · ${event.address}` : ""}
          </p>

          <div className="mt-8 whitespace-pre-line text-paper/80 leading-relaxed">
            {description}
          </div>

          <LocationMap venue={event.venue} address={event.address} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <TicketPurchasePanel
            eventId={event.id}
            ticketMode={event.ticketMode}
            priceCents={event.priceCents}
            currency={event.currency}
            guestlistTiers={event.guestlistTiers.map((tier) => ({
              id: tier.id,
              label: tier.label,
              untilTime: tier.untilTime.toISOString(),
              priceCents: tier.priceCents
            }))}
            guestlistPrice={guestlistPrice}
            spotsLeft={spotsLeft}
            isSoldOut={isSoldOut}
            salesEndAtIso={salesEndAtIso}
            salesClosed={salesClosed}
            autoDiscount={autoDiscount?.rule ?? null}
            locale={locale}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
