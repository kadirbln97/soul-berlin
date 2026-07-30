import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-paper/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="SØUL Berlin"
            width={120}
            height={120}
            className="h-9 w-auto invert-0"
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
