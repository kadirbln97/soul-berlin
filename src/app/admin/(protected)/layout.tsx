import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "./LogoutButton";
import { getAdminSession } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

/**
 * Zweite, unabhängige Zugangsprüfung für den gesamten Admin-Bereich.
 *
 * Die Middleware (src/middleware.ts) prüft dasselbe bereits vorher. Diese
 * Prüfung hier ist bewusst redundant: Middleware-Prüfungen sind in der
 * Vergangenheit durch Framework-Lücken umgehbar gewesen (z.B. Next.js
 * CVE-2025-29927). Fällt die eine Schicht aus, greift die andere — die
 * Gästedaten sind dann trotzdem nicht öffentlich einsehbar.
 */
export default async function AdminProtectedLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4">
          <Link href="/admin" className="text-display text-lg uppercase text-paper">
            SØUL Admin
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-widest text-paper/70 sm:gap-x-5">
            <Link href="/admin" className="hover:text-soul-orange">
              Dashboard
            </Link>
            <Link href="/admin/homepage" className="hover:text-soul-orange">
              Startseite
            </Link>
            <Link href="/admin/scanner" className="hover:text-soul-orange">
              Scanner
            </Link>
            <Link href="/admin/gallery" className="hover:text-soul-orange">
              Galerie
            </Link>
            <Link href="/" className="hover:text-soul-orange">
              Live-Seite
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-10">{children}</main>
    </div>
  );
}
