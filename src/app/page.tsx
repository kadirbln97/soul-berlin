import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { getUpcomingPublishedEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await getUpcomingPublishedEvents(6);
  const nextEvent = events[0];

  return (
    <>
      <Header />
      <main>
        <section className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 pb-16 pt-16 text-center sm:pt-24">
          <Image
            src="/logo.png"
            alt="SØUL Berlin"
            width={280}
            height={280}
            priority
            className="h-20 w-auto sm:h-28"
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
                  isSoldOut={event.isSoldOut}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
