import Link from "next/link";
import { getTranslations } from "@/lib/serverLocale";

export async function Footer() {
  const { t } = await getTranslations();

  return (
    <footer className="border-t border-paper/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center">
        <p className="text-display text-2xl italic-skew text-paper">SØUL BERLIN</p>
        <p className="text-xs uppercase tracking-widest text-paper/50">
          Good people. Good music.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper/50">
          <Link href="/kontakt" className="hover:text-soul-orange">
            {t.footer.contact}
          </Link>
          <Link href="/legal/impressum" className="hover:text-soul-orange">
            {t.footer.imprint}
          </Link>
          <Link href="/legal/agb" className="hover:text-soul-orange">
            {t.footer.terms}
          </Link>
          <Link href="/legal/datenschutz" className="hover:text-soul-orange">
            {t.footer.privacy}
          </Link>
          <a
            href="https://www.instagram.com/soulberliin/"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-soul-orange"
          >
            Instagram
          </a>
          <a
            href="https://chat.whatsapp.com/FGUD95jUIRz4TeJ7fcRqq8"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-soul-orange"
          >
            {t.footer.whatsapp}
          </a>
        </div>
        <p className="text-[11px] text-paper/30">
          © {new Intl.DateTimeFormat("de-DE", { year: "numeric", timeZone: "Europe/Berlin" }).format(new Date())} SØUL Berlin
        </p>
      </div>
    </footer>
  );
}
