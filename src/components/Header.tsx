import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "@/lib/serverLocale";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const { locale, t } = await getTranslations();

  return (
    // relative, damit sich das aufgeklappte Handy-Menü darunter aufhängen kann.
    <header className="sticky top-0 z-40 border-b border-paper/10 bg-ink/80 backdrop-blur relative">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-soul-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        {t.nav.skipToContent}
      </a>
      {/* Auf dem Handy schmaler: Logo und Menü-Knopf brauchen dort keine
          112 px Leiste — das schluckte oben unnötig Bildschirmhöhe. */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5 sm:py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="SØUL Berlin"
            width={160}
            height={160}
            className="h-14 w-auto invert-0 sm:h-24"
            priority
          />
        </Link>
        {/* Ab sm die gewohnte Leiste, darunter das Burger-Menü. */}
        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-widest text-paper/80 sm:flex">
          <Link href="/" className="transition hover:text-soul-orange">
            {t.nav.home}
          </Link>
          <Link href="/events" className="transition hover:text-soul-orange">
            {t.nav.events}
          </Link>
          <a
            href="https://www.instagram.com/soulberliin/"
            target="_blank"
            rel="noreferrer noopener"
            className="transition hover:text-soul-orange"
          >
            {t.nav.instagram}
          </a>
          <LanguageSwitcher current={locale} />
        </nav>

        <MobileMenu
          locale={locale}
          labels={{
            home: t.nav.home,
            events: t.nav.events,
            instagram: t.nav.instagram,
            menu: t.nav.menu,
            close: t.nav.close
          }}
        />
      </div>
    </header>
  );
}
