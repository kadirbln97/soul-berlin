import { EventForm } from "@/components/EventForm";

export default function NewEventPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-display mb-8 text-3xl uppercase text-paper">Neues Event</h1>
      <EventForm />
    </div>
  );
}
