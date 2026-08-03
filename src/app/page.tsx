import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { Gallery } from "@/components/Gallery";
import { AiBadge } from "@/components/AiBadge";
import { getUpcomingPublishedEvents } from "@/lib/events";
import { getCurrentGuestlistPrice } from "@/lib/guestlistTiers";
import { getSiteContent } from "@/lib/siteContent";
import { getTranslations, pickText } from "@/lib/serverLocale";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Texte/Bilder kommen aus dem Startseiten-Baukasten (/admin/homepage);
  // ohne gespeicherte Werte greifen automatisch die Standardtexte.
  const { locale, t } = await getTranslations();
  const [events, content] = await Promise.all([
    getUpcomingPublishedEvents(6),
    getSiteContent(locale)
  ]);
  const nextEvent = events[0];

  return (
    <>
      <Header />
      <main id="main-content">
        {/* Der Kopfbereich wird auf großen Bildschirmen deutlich höher. Grund:
            das Hero-Foto ist ein Hochformat (1600×2400). In einem flachen,
            breiten Rahmen schneidet object-cover fast das ganze Bild weg — es
            blieb nur ein dunkler Streifen Decke übrig. Mit mehr Höhe bekommt
            das Motiv wieder Platz. */}
        <section className="relative flex min-h-[420px] flex-col items-center justify-center gap-6 overflow-hidden px-5 py-14 text-center sm:min-h-[720px] sm:gap-8 sm:py-24 lg:min-h-[840px]">
          {/* Priority + kleine Auflösung (1600px/WebP, ~260KB) hält den größten
              Seiteninhalt (LCP) trotz echtem Eventfoto schnell.
              object-position ist responsiv: mobil (schmaler, hoher Rahmen)
              reicht ein leichter Versatz, ab sm rutscht der Ausschnitt so,
              dass Gesicht und SØUL-Leuchtschild gemeinsam im Bild bleiben. */}
          <Image
            src={content.hero_image}
            alt="Tanzfläche mit leuchtendem SØUL-Schild bei einem SØUL Berlin Event"
            fill
            priority
            sizes="100vw"
            unoptimized={content.hero_image.startsWith("http")}
            className="object-cover object-[64%_30%] sm:object-[68%_22%]"
          />

          {/* Drei getrennte Schichten statt einer flächigen Abdunklung — vorher
              lag ein Verlauf mit 40–100 % Schwarz über dem gesamten Bild, das
              Foto war dadurch kaum noch zu erkennen.
              1) senkrecht: dunkelt unten (Übergang zur Seite) und ganz oben ab,
                 lässt die Bildmitte aber weitgehend frei */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#0a0a0a_0%,rgba(10,10,10,0.92)_12%,rgba(10,10,10,0.55)_38%,rgba(10,10,10,0.18)_62%,rgba(10,10,10,0.55)_100%)]"
          />
          {/* 2) schmaler Streifen oben: hält Logo und Navigation im Header lesbar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ink/85 to-transparent"
          />
          {/* 3) weicher Kreis hinter dem Text: sorgt für Kontrast genau dort, wo
                 Überschrift und Claim stehen — auf dem Handy breiter, weil der
                 Text dort fast die volle Breite einnimmt */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_46%_at_50%_60%,rgba(10,10,10,0.72)_0%,rgba(10,10,10,0.42)_50%,transparent_80%)] sm:bg-[radial-gradient(58%_46%_at_50%_62%,rgba(10,10,10,0.72)_0%,rgba(10,10,10,0.42)_45%,transparent_78%)]"
          />
          {content.hero_image_ai === "1" && (
            <AiBadge label={t.ai.badge} title={t.ai.imageNotice} position="bottom-3 right-3" />
          )}

          {/* Bewusst ohne Wortmarke: die steht bereits oben links im Header.
              Zweimal dasselbe Logo übereinander bringt keine Information und
              drückt den Claim nur nach unten. */}
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 sm:gap-8">
            {/* Weicher Schatten als zweite Absicherung: das Foto ist an dieser
                Stelle jetzt heller, der Text muss trotzdem überall stehen. */}
            <h1 className="text-display text-4xl uppercase leading-[0.95] text-paper [text-shadow:0_2px_24px_rgba(0,0,0,0.75)] sm:text-6xl">
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
              <p className="max-w-xl text-sm uppercase tracking-[0.3em] text-paper/70 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)]">
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
              className="text-xs font-semibold uppercase tracking-widest text-paper/75 hover:text-soul-orange"
            >
              {content.events_link_label}
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="rounded-2xl card-border p-10 text-center text-paper/70">
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
                  imageIsAi={event.imageIsAi}
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
              <p className="mt-1 text-sm text-paper/70">{content.gallery_subtext}</p>
            )}
          </div>
          <Gallery />
        </section>
      </main>
      <Footer />
    </>
  );
}
