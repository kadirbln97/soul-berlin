import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { tablePlanSchema } from "@/lib/tablePlan";

/**
 * Tischplan eines Events zum Übernehmen in ein anderes Event. Liefert den
 * Plan mit allen Tischen als frei — „vergeben“ gehört zum alten Abend.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id }, select: { tablePlan: true } });
  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const parsed = tablePlanSchema.safeParse(event.tablePlan);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dieses Event hat keinen Tischplan." }, { status: 404 });
  }

  return NextResponse.json({
    tablePlan: {
      ...parsed.data,
      tables: parsed.data.tables.map((t) => ({ ...t, isReserved: false }))
    }
  });
}
