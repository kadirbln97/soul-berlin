import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true }
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/kontakt`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/legal/impressum`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/legal/datenschutz`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/legal/agb`, changeFrequency: "yearly", priority: 0.2 }
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${appUrl}/events/${event.slug}`,
    lastModified: event.updatedAt,
    changeFrequency: "daily",
    priority: 0.8
  }));

  return [...staticRoutes, ...eventRoutes];
}
