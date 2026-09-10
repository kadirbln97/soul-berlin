import { EventForm } from "@/components/EventForm";
import { getTablePlanSources } from "@/lib/tablePlanSources";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const tablePlanSources = await getTablePlanSources();

  return (
    <div className="max-w-3xl">
      <h1 className="text-display mb-8 text-3xl uppercase text-paper">Neues Event</h1>
      <EventForm tablePlanSources={tablePlanSources} />
    </div>
  );
}
