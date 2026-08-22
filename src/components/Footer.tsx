import Link from "next/link";
import { getTranslations } from "@/lib/serverLocale";
import { getSiteContent } from "@/lib/siteContent";

export async function Footer() {
  const { t } = await getTranslations();
  const content = await getSiteContent();

  return (
    <footer className="border-t border-paper/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center">
        <p className="text-display text-2xl italic-skew text-paper">SØUL BERLIN</p>
        <p className="text-xs uppercase tracking-widest text-paper/70">
          Good people. Good music.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper/70">
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
          {/* Adressen kommen aus dem Baukasten. Ist ein Feld leer, fällt der
              Link weg statt ins Nichts zu führen. */}
          {content.link_instagram && (
            <a
              href={content.link_instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-soul-orange"
            >
              Instagram
            </a>
          )}
          {content.link_whatsapp && (
            <a
              href={content.link_whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-soul-orange"
            >
              {t.footer.whatsapp}
            </a>
          )}
        </div>
        <p className="text-[11px] text-paper/50">
          © {new Intl.DateTimeFormat("de-DE", { year: "numeric", timeZone: "Europe/Berlin" }).format(new Date())} SØUL Berlin
        </p>
      </div>
    </footer>
  );
}
