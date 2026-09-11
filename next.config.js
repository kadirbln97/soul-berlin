/** @type {import('next').NextConfig} */
const nextConfig = {
  // Verrät sonst in jeder Antwort "X-Powered-By: Next.js" — unnötige
  // Information für automatisierte Schwachstellen-Scanner.
  poweredByHeader: false,
  images: {
    // Nur der eigene Blob-Speicher statt "**": mit dem Platzhalter kann jeder
    // /_next/image?url=https://beliebige-seite/… aufrufen und den Server
    // fremde Bilder laden und umrechnen lassen (Bandbreite, Kosten, Missbrauch
    // als Proxy). Hochgeladene Bilder liegen ausschließlich bei Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }
    ],
    // AVIF zusätzlich zu WebP: nochmal spürbar kleiner bei gleicher Qualität;
    // Browser ohne AVIF bekommen automatisch weiterhin WebP.
    formats: ["image/avif", "image/webp"],
    // Ohne diese Zeile nimmt Next.js seine Standardliste bis 3840px — die
    // größte Stufe greift beim vollflächigen Hero-Bild auf breiten/hochauf-
    // lösenden Bildschirmen (gemessen: 3840px-Variante wurde tatsächlich
    // ausgeliefert). Für ein Deko-Hintergrundbild mit dunklem Verlauf
    // darüber unnötig groß; 2560px deckt reguläre und die meisten Retina-
    // Bildschirme weiterhin scharf ab, spart aber deutlich Bytes auf den
    // größten Screens.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560]
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  async headers() {
    return [
      {
        // Auf allen Seiten: solide Basis-Sicherheitsheader.
        source: "/:path*",
        headers: [
          // Vercel setzt HSTS zwar von sich aus, aber ohne includeSubDomains —
          // damit bliebe z.B. www.soulberlin.de oder eine spätere Subdomain
          // ohne den Zwang zu HTTPS.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains"
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // SAMEORIGIN statt DENY: fremde Seiten können die Seite weiterhin
          // nicht einbetten (Schutz vor Clickjacking bleibt), aber die
          // Live-Vorschau im Admin-Baukasten (/admin/homepage) darf die eigene
          // Startseite in einem iframe anzeigen.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Trennt unser Fenster von fremden Öffnern/Popups (Schutz gegen
          // Cross-Site-Leaks). Wir öffnen selbst keine Popups, die uns
          // zurückrufen müssten.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            // Kamera nur für die eigene Seite erlaubt (wird vom Scanner gebraucht),
            // alles andere (Mikrofon, Standort, Zahlungs-API) blockiert.
            value: "camera=(self), microphone=(), geolocation=(), payment=()"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
