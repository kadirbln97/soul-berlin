import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./LogoutButton";

export default function AdminProtectedLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-paper/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="text-display text-lg uppercase text-paper">
            SØUL Admin
          </Link>
          <nav className="flex items-center gap-5 text-xs font-semibold uppercase tracking-widest text-paper/70">
            <Link href="/admin" className="hover:text-soul-orange">
              Dashboard
            </Link>
            <Link href="/admin/scanner" className="hover:text-soul-orange">
              Scanner
            </Link>
            <Link href="/" className="hover:text-soul-orange">
              Live-Seite
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
