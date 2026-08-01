import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SuccessContent } from "@/components/SuccessContent";
import { getTranslations } from "@/lib/serverLocale";

export const dynamic = "force-dynamic";

export default function SuccessPage() {
  const { locale } = getTranslations();

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 py-24 text-center"
      >
        <SuccessContent locale={locale} />
      </main>
      <Footer />
    </>
  );
}
