import { prisma } from "@/lib/prisma";
import { ScannerClient } from "@/components/ScannerClient";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const events = await prisma.event.findMany({
    orderBy: [{ status: "asc" }, { dateStart: "desc" }],
    select: { id: true, title: true, status: true }
  });

  // Veröffentlichte Events zuerst (die sind für den Türsteher relevant),
  // innerhalb jeder Gruppe neueste zuerst.
  const sorted = [...events].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "PUBLISHED" ? -1 : 1;
  });

  return <ScannerClient events={sorted} />;
}
