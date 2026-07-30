import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour = 23, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const existing = await prisma.event.count();
  if (existing > 0) {
    console.log("Es gibt bereits Events — Seed wird übersprungen.");
    return;
  }

  await prisma.event.create({
    data: {
      slug: "soul-rooftop-edition",
      title: "SØUL ROOFTOP EDITION",
      subtitle: "House Music Sunset Session",
      description:
        "Good people. Good music.\n\nUnsere Rooftop-Edition mit den besten House-Sounds über den Dächern Berlins. Dresscode: Smart. Einlass ab 21 Uhr.",
      venue: "THE DOOR Boutique Club",
      address: "Berlin",
      imageUrl: null,
      dateStart: daysFromNow(14, 21, 0),
      ticketMode: "PAID",
      priceCents: 1500,
      currency: "eur",
      capacity: 150,
      status: "PUBLISHED"
    }
  });

  await prisma.event.create({
    data: {
      slug: "soul-community-night",
      title: "SØUL COMMUNITY NIGHT",
      subtitle: "Free Entry — Guestlist only",
      description:
        "Good people. Good music.\n\nUnsere Community Night ist kostenlos über die Gästeliste — meld dich an und sichere dir deinen Platz. Begrenzte Kapazität.",
      venue: "THE DOOR Boutique Club",
      address: "Berlin",
      imageUrl: null,
      dateStart: daysFromNow(21, 23, 0),
      ticketMode: "GUESTLIST",
      priceCents: null,
      currency: "eur",
      capacity: 200,
      status: "PUBLISHED"
    }
  });

  console.log("Demo-Events angelegt: SØUL ROOFTOP EDITION (bezahlt), SØUL COMMUNITY NIGHT (Gästeliste).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
