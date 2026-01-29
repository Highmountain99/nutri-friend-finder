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
        <p className="text-sm">Inga måltider loggade idag</p>
        <p className="text-xs mt-1">Tryck på kameraknappen för att börja</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {/* Timeline line */}
      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-muted-foreground/20" />
      
      {timelineItems.map((item) => (
        <div key={item.id} className="relative">
          {item.type === "meal" ? (
            <>
              <div className="pl-8">
                {/* Timeline dot for meal */}
                <div className="absolute left-3 top-6 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                
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
                <div className="mt-2 space-y-2 pl-12">
                  {item.linkedSymptoms.map((symptom) => (
                    <div key={symptom.id} className="relative">
                      {/* Small connector dot */}
                      <div className="absolute -left-5 top-4 w-2 h-2 rounded-full bg-accent border border-background" />
                      <SymptomCard
                        symptom={symptom}
                        linkedMeal={item.data as NutritionEntry}
                        onClick={() => onSymptomClick?.(symptom)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="pl-8">
              {/* Timeline dot for standalone symptom */}
              <div className="absolute left-3 top-6 w-3 h-3 rounded-full bg-accent border-2 border-background" />
              
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
