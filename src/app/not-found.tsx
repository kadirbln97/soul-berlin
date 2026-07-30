import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto flex max-w-xl flex-col items-center gap-4 px-5 py-32 text-center">
        <p className="text-display text-3xl uppercase text-soul-orange">404</p>
        <p className="text-paper/60">Diese Seite gibt es nicht (mehr).</p>
        <Link href="/" className="btn-outline mt-2">
          Zurück zur Startseite
        </Link>
      </main>
      <Footer />
    </>
  );
}
