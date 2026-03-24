import { useState } from "react";
import { ProgressRouter } from "@/components/progress/ProgressRouter";
import { TreatmentJourneySheet } from "@/components/progress/TreatmentJourneySheet";

export default function Progress() {
  const [journeyOpen, setJourneyOpen] = useState(false);

  return (
    <div className="animate-fade-in relative">
      <ProgressRouter
        onOpenJourney={() => setJourneyOpen(true)}
      />
      <TreatmentJourneySheet open={journeyOpen} onOpenChange={setJourneyOpen} />
    </div>
  );
}
