import { useState } from "react";
import { ProgressRouter } from "@/components/progress/ProgressRouter";
import { TreatmentJourneySheet } from "@/components/progress/TreatmentJourneySheet";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";

export default function Progress() {
  const [journeyOpen, setJourneyOpen] = useState(false);

  return (
    <div className="animate-fade-in relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 z-10"
        onClick={() => setJourneyOpen(true)}
        aria-label="Visa programöversikt"
      >
        <Map className="w-5 h-5" />
      </Button>
      <ProgressRouter />
      <TreatmentJourneySheet open={journeyOpen} onOpenChange={setJourneyOpen} />
    </div>
  );
}
