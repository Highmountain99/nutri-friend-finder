import { MealEntryCard } from "./MealEntryCard";
import type { NutritionEntry } from "@/hooks/useJournalData";

interface MealTimelineProps {
  entries: NutritionEntry[];
  onEntryClick?: (entry: NutritionEntry) => void;
  showCalories?: boolean;
  showProtein?: boolean;
  showCarbs?: boolean;
  showFat?: boolean;
}

export function MealTimeline({ 
  entries, 
  onEntryClick,
  showCalories = true,
  showProtein = true,
  showCarbs = true,
  showFat = true,
}: MealTimelineProps) {
  // Sort entries by time, newest first
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (entries.length === 0) {
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
      
      {sortedEntries.map((entry) => (
        <div key={entry.id} className="relative pl-8">
          {/* Timeline dot */}
          <div className="absolute left-3 top-6 w-3 h-3 rounded-full bg-primary border-2 border-background" />
          
          <MealEntryCard 
            entry={entry} 
            onClick={() => onEntryClick?.(entry)}
            showCalories={showCalories}
            showProtein={showProtein}
            showCarbs={showCarbs}
            showFat={showFat}
          />
        </div>
      ))}
    </div>
  );
}
