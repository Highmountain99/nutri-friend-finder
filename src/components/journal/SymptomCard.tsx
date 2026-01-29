import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SymptomEntry, NutritionEntry } from "@/hooks/useJournalData";

interface SymptomCardProps {
  symptom: SymptomEntry;
  linkedMeal?: NutritionEntry;
  onClick?: () => void;
}

export function SymptomCard({ symptom, linkedMeal, onClick }: SymptomCardProps) {
  const timeDisplay = format(symptom.symptomTime, "HH:mm", { locale: sv });

  return (
    <Card
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-accent"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 rounded-full bg-accent/10 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-accent" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{timeDisplay}</span>
          </div>
          
          <p className="text-sm mt-1 line-clamp-2">{symptom.description}</p>
          
          {linkedMeal && (
            <p className="text-xs text-muted-foreground mt-2">
              Kopplat till: {linkedMeal.mealType} - {linkedMeal.mealName}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
