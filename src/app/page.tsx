import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { Gallery } from "@/components/Gallery";
import { getUpcomingPublishedEvents } from "@/lib/events";
import { getCurrentGuestlistPrice } from "@/lib/guestlistTiers";
import { getSiteContent } from "@/lib/siteContent";
import { getTranslations, pickText } from "@/lib/serverLocale";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Texte/Bilder kommen aus dem Startseiten-Baukasten (/admin/homepage);
  // ohne gespeicherte Werte greifen automatisch die Standardtexte.
  const { locale } = getTranslations();
  const [events, content] = await Promise.all([
    getUpcomingPublishedEvents(6),
    getSiteContent(locale)
  ]);
  const nextEvent = events[0];

  return (
    <>
      <Header />
      <main id="main-content">
        <section className="relative flex min-h-[560px] flex-col items-center justify-center gap-8 overflow-hidden px-5 py-24 text-center sm:min-h-[640px]">
          {/* Priority + kleine Auflösung (1600px/WebP, ~260KB) hält den größten
              Seiteninhalt (LCP) trotz echtem Eventfoto schnell.
              object-position ist responsiv: mobil zeigt der Ausschnitt mehr vom
              Foto (inkl. Tänzerin), ab sm-Breakpoint (breiterer/flacherer Crop)
              rutscht der Ausschnitt höher Richtung Decke, damit oberhalb des
              Kopfes genug dunkler Platz für das Logo bleibt. Das SØUL-Schild
              bleibt in beiden Fällen sichtbar. */}
          <Image
            src={content.hero_image}
            alt="Tanzfläche mit leuchtendem SØUL-Schild bei einem SØUL Berlin Event"
            fill
            priority
            sizes="100vw"
            unoptimized={content.hero_image.startsWith("http")}
            className="object-cover object-[64%_30%] sm:object-[64%_12%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-8">
            {/* Nach oben versetzt (relative -top), damit das Wordmark im dunklen
                Deckenbereich des Fotos sitzt statt über dem Kopf der Tänzerin. */}
            <Image
              src="/logo.png"
              alt="SØUL Berlin"
              width={280}
              height={280}
              priority
              className="relative -top-[60px] h-20 w-auto sm:top-0 sm:h-28"
            />
            <h1 className="text-display text-4xl uppercase leading-[0.95] text-paper sm:text-6xl">
              {content.hero_headline_1}
              {content.hero_headline_2 && (
                <>
                  <br />
                  <span className="text-soul-orange italic-skew">
                    {content.hero_headline_2}
                  </span>
                </>
              )}
            </h1>
            {content.hero_tagline && (
              <p className="max-w-xl text-sm uppercase tracking-[0.3em] text-paper/50">
                {content.hero_tagline}
              </p>
            )}

            {nextEvent && (
              <Link
                href={`/events/${nextEvent.slug}`}
                className="btn-primary mt-2"
              >
                {content.hero_cta_prefix
                  ? `${content.hero_cta_prefix} ${pickText(locale, nextEvent.title, nextEvent.titleEn)} →`
                  : `${pickText(locale, nextEvent.title, nextEvent.titleEn)} →`}
              </Link>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-display text-2xl uppercase text-paper sm:text-3xl">
              {content.events_heading}
            </h2>
            <Link
              href="/events"
              className="text-xs font-semibold uppercase tracking-widest text-paper/60 hover:text-soul-orange"
            >
              {content.events_link_label}
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="rounded-2xl card-border p-10 text-center text-paper/50">
              {content.events_empty_text}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
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
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="mb-8">
            <h2 className="text-display text-2xl uppercase text-paper sm:text-3xl">
              {content.gallery_heading}
            </h2>
            {content.gallery_subtext && (
              <p className="mt-1 text-sm text-paper/50">{content.gallery_subtext}</p>
            )}
          </div>
          <Gallery />
        </section>
      </main>
      <Footer />
    </>
  );
}
