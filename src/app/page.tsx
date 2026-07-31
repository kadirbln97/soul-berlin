import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { Gallery } from "@/components/Gallery";
import { getUpcomingPublishedEvents } from "@/lib/events";
import { getCurrentGuestlistPrice } from "@/lib/guestlistTiers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await getUpcomingPublishedEvents(6);
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
            src="/media/photos/hero-dancefloor.webp"
            alt="Tanzfläche mit leuchtendem SØUL-Schild bei einem SØUL Berlin Event"
            fill
            priority
            sizes="100vw"
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
              Good people.
              <br />
              <span className="text-soul-orange italic-skew">Good music.</span>
            </h1>
            <p className="max-w-xl text-sm uppercase tracking-[0.3em] text-paper/50">
              House Music Culture · Berlin
            </p>

            {nextEvent && (
              <Link
                href={`/events/${nextEvent.slug}`}
                className="btn-primary mt-2"
              >
                Nächstes Event: {nextEvent.title} →
              </Link>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-display text-2xl uppercase text-paper sm:text-3xl">
              Upcoming Events
            </h2>
            <Link
              href="/events"
              className="text-xs font-semibold uppercase tracking-widest text-paper/60 hover:text-soul-orange"
            >
              Alle ansehen →
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="rounded-2xl card-border p-10 text-center text-paper/50">
              Aktuell sind keine Events veröffentlicht — schau bald wieder vorbei.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  slug={event.slug}
                  title={event.title}
                  subtitle={event.subtitle}
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
              SØUL in Action
            </h2>
            <p className="mt-1 text-sm text-paper/50">
              Impressionen von den letzten Events — Fotos & kurze Clips.
            </p>
          </div>
          <Gallery />
        </section>
      </main>
      <Footer />
    </>
  );
}
