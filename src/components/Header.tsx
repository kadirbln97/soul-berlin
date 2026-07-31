import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-paper/10 bg-ink/80 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-soul-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Zum Inhalt springen
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="SØUL Berlin"
            width={160}
            height={160}
            className="h-12 w-auto invert-0 sm:h-14"
            priority
          />
        </Link>
        <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-paper/80">
          <Link href="/" className="transition hover:text-soul-orange">
            Home
          </Link>
          <Link href="/events" className="transition hover:text-soul-orange">
            Events
          </Link>
          <a
            href="https://www.instagram.com/soulberliin/"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden transition hover:text-soul-orange sm:inline"
          >
            Instagram
          </a>
        </nav>
      </div>
    </header>
  );
}
