/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
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
