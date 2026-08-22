import type { MetadataRoute } from "next";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin-Bereich, interne API-Routen und persönliche Ticket-Seiten
        // sollen nicht indexiert werden. /newsletter ebenfalls: die Seiten
        // funktionieren nur mit persönlichem Token und haben für Suchende
        // keinen Nutzen — außerdem sollen die Token nicht in einem Index landen.
        disallow: ["/admin", "/api", "/ticket", "/newsletter"]
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`
  };
}
