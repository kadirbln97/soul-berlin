import { LoadingEqualizer } from "@/components/LoadingEqualizer";

// Next.js zeigt diese Datei automatisch, solange page.tsx (force-dynamic,
// mehrere DB-Abfragen) noch lädt — sowohl beim ersten Aufruf als auch bei
// Links, die client-seitig hierher navigieren.
export default function Loading() {
  return <LoadingEqualizer />;
}
