import type { MetadataRoute } from "next";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin-Bereich, interne API-Routen und persönliche Ticket-Seiten
        // sollen nicht indexiert werden.
        disallow: ["/admin", "/api", "/ticket"]
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`
  };
}
