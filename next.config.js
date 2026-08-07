/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ],
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
          { key: "X-Content-Type-Options", value: "nosniff" },
          // SAMEORIGIN statt DENY: fremde Seiten können die Seite weiterhin
          // nicht einbetten (Schutz vor Clickjacking bleibt), aber die
          // Live-Vorschau im Admin-Baukasten (/admin/homepage) darf die eigene
          // Startseite in einem iframe anzeigen.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
