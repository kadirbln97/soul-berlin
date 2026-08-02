import Link from "next/link";
import { formatShortDate, formatPrice } from "@/lib/format";
import { getTranslations } from "@/lib/serverLocale";

export async function EventCard({
  slug,
  title,
  subtitle,
  venue,
  imageUrl,
  dateStart,
  ticketMode,
  priceCents,
  guestlistPriceCents,
  isSoldOut
}: {
  slug: string;
  title: string;
  subtitle?: string | null;
  venue: string;
  imageUrl?: string | null;
  dateStart: Date | string;
  ticketMode: string;
  priceCents?: number | null;
  // Aktuell gültiger Gästeliste-Staffelpreis (null = weiterhin kostenlos).
  guestlistPriceCents?: number | null;
  isSoldOut: boolean;
}) {
  const { t } = await getTranslations();

  const badge = isSoldOut
    ? t.events.soldOut
    : ticketMode === "PAID"
      ? priceCents
        ? formatPrice(priceCents)
        : t.events.ticket
      : ticketMode === "BOTH"
        ? t.events.ticketAndGuestlist
        : guestlistPriceCents
          ? `${t.events.from} ${formatPrice(guestlistPriceCents)}`
          : t.events.guestlist;

  return (
    <Link
      href={`/events/${slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl card-border bg-white/[0.02] transition hover:-translate-y-1 hover:border-soul-orange/60 hover:shadow-xl hover:shadow-black/40"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-display text-4xl italic-skew text-paper/20">
            SØUL
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <span className="rounded-full bg-soul-orange px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink">
            {formatShortDate(dateStart)}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="text-display text-xl uppercase leading-tight text-paper">{title}</h3>
        {subtitle && <p className="text-sm text-paper/60">{subtitle}</p>}
        <p className="mt-1 text-xs uppercase tracking-widest text-paper/40">{venue}</p>
        <div className="mt-4 flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${
              isSoldOut ? "text-paper/40" : "text-soul-orange"
            }`}
          >
            {badge}
          </span>
          <span className="text-xs uppercase tracking-widest text-paper/50 transition group-hover:text-soul-orange">
            {t.events.details}
          </span>
        </div>
      </div>
    </Link>
  );
}
