import { MealEntryCard } from "./MealEntryCard";
import { SymptomCard } from "./SymptomCard";
import type { NutritionEntry, SymptomEntry } from "@/hooks/useJournalData";

interface MealTimelineProps {
  entries: NutritionEntry[];
  symptoms?: SymptomEntry[];
  onEntryClick?: (entry: NutritionEntry) => void;
  onSymptomClick?: (symptom: SymptomEntry) => void;
  showCalories?: boolean;
  showProtein?: boolean;
  showCarbs?: boolean;
  showFat?: boolean;
}

interface TimelineItem {
  type: "meal" | "symptom";
  id: string;
  time: Date;
  data: NutritionEntry | SymptomEntry;
  linkedSymptoms?: SymptomEntry[];
}

export function MealTimeline({ 
  entries, 
  symptoms = [],
  onEntryClick,
  onSymptomClick,
  showCalories = true,
  showProtein = true,
  showCarbs = true,
  showFat = true,
}: MealTimelineProps) {
  // Build timeline items
  const timelineItems: TimelineItem[] = [];

  // Add meals with their linked symptoms
  entries.forEach((entry) => {
    const linkedSymptoms = symptoms.filter((s) => s.mealId === entry.id);
    timelineItems.push({
      type: "meal",
      id: entry.id,
      time: entry.createdAt,
      data: entry,
      linkedSymptoms,
    });
  });

  // Add unlinked symptoms as standalone items
  const unlinkedSymptoms = symptoms.filter((s) => !s.mealId);
  unlinkedSymptoms.forEach((symptom) => {
    timelineItems.push({
      type: "symptom",
      id: symptom.id,
      time: symptom.symptomTime,
      data: symptom,
    });
  });

  // Sort by time, newest first
  timelineItems.sort((a, b) => b.time.getTime() - a.time.getTime());

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm font-semibold text-primary/70">Inga måltider loggade</p>
        <p className="text-xs mt-1 text-primary/50">Tryck på kameraknappen för att börja</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      
      {timelineItems.map((item) => (
        <div key={item.id} className="relative">
          {item.type === "meal" ? (
            <>
              <div>
                <MealEntryCard 
                  entry={item.data as NutritionEntry} 
                  onClick={() => onEntryClick?.(item.data as NutritionEntry)}
                  showCalories={showCalories}
                  showProtein={showProtein}
                  showCarbs={showCarbs}
                  showFat={showFat}
                />
              </div>
              
              {/* Linked symptoms as sub-items */}
              {item.linkedSymptoms && item.linkedSymptoms.length > 0 && (
                <div className="ml-6 mt-1.5 space-y-1">
                  {item.linkedSymptoms.map((symptom) => (
                    <div key={symptom.id} className="relative flex items-center">
                      {/* Horisontell kopplingsstreck */}
                      <SymptomCard
                        symptom={symptom}
                        onClick={() => onSymptomClick?.(symptom)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <SymptomCard
                symptom={item.data as SymptomEntry}
                onClick={() => onSymptomClick?.(item.data as SymptomEntry)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
