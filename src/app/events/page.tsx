import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { getUpcomingPublishedEvents, getPastPublishedEvents } from "@/lib/events";
import { getCurrentGuestlistPrice } from "@/lib/guestlistTiers";
import { getTranslations, pickText } from "@/lib/serverLocale";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const { locale, t } = getTranslations();
  const [upcoming, past] = await Promise.all([
    getUpcomingPublishedEvents(),
    getPastPublishedEvents(6)
  ]);

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-display mb-10 text-4xl uppercase text-paper">{t.events.title}</h1>

        {upcoming.length === 0 ? (
          <p className="rounded-2xl card-border p-10 text-center text-paper/50">
            {t.events.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                slug={event.slug}
                title={pickText(locale, event.title, event.titleEn)}
                subtitle={pickText(locale, event.subtitle ?? "", event.subtitleEn) || null}
                venue={event.venue}
                imageUrl={event.imageUrl}
                dateStart={event.dateStart}
                ticketMode={event.ticketMode}
                priceCents={event.priceCents}
                guestlistPriceCents={getCurrentGuestlistPrice(event.guestlistTiers)}
                isSoldOut={event.isSoldOut}
              />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-20">
            <h2 className="text-display mb-8 text-2xl uppercase text-paper/60">{t.events.past}</h2>
            <div className="grid grid-cols-1 gap-6 opacity-50 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard
                  key={event.id}
                  slug={event.slug}
                  title={pickText(locale, event.title, event.titleEn)}
                  subtitle={pickText(locale, event.subtitle ?? "", event.subtitleEn) || null}
                  venue={event.venue}
                  imageUrl={event.imageUrl}
                  dateStart={event.dateStart}
                  ticketMode={event.ticketMode}
                  priceCents={event.priceCents}
                  isSoldOut={true}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
