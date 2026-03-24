import { useState } from "react";
import { ProgressRouter } from "@/components/progress/ProgressRouter";
import { TreatmentJourneySheet } from "@/components/progress/TreatmentJourneySheet";
import { FlagTriangleRight } from "lucide-react";

export default function Progress() {
  const [journeyOpen, setJourneyOpen] = useState(false);

  return (
    <div className="animate-fade-in relative">
      <button
        className="absolute top-2 right-4 z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
        onClick={() => setJourneyOpen(true)}
        aria-label="Visa programöversikt"
      >
        <FlagTriangleRight className="w-5 h-5 text-primary-foreground" />
      </button>
      <ProgressRouter />
      <TreatmentJourneySheet open={journeyOpen} onOpenChange={setJourneyOpen} />
    </div>
  );
}
