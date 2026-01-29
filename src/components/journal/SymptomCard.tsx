import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { SymptomEntry } from "@/hooks/useJournalData";

interface SymptomCardProps {
  symptom: SymptomEntry;
  onClick?: () => void;
}

export function SymptomCard({ symptom, onClick }: SymptomCardProps) {
  const timeDisplay = format(symptom.symptomTime, "HH:mm", { locale: sv });

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-muted/50 
                 cursor-pointer hover:bg-muted transition-colors text-sm"
      onClick={onClick}
    >
      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
      <span className="text-xs text-muted-foreground">{timeDisplay}</span>
      <span className="text-xs truncate">{symptom.description}</span>
    </div>
  );
}
