import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { NutritionEntry } from "@/hooks/useJournalData";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface MealEntryCardProps {
  entry: NutritionEntry;
  onClick?: () => void;
}

export function MealEntryCard({ entry, onClick }: MealEntryCardProps) {
  const timeStr = format(new Date(entry.createdAt), "HH:mm", { locale: sv });
  
  return (
    <Card 
      className="shadow-soft cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex gap-2.5 sm:gap-3">
          {/* Image or placeholder */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {entry.imageUrl ? (
              <img 
                src={entry.imageUrl} 
                alt={entry.mealName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-primary/50" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {entry.mealType} • {timeStr}
              </span>
              {entry.isAiEstimated && (
                <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1 sm:px-1.5 py-0.5 rounded">
                  AI
                </span>
              )}
            </div>
            
            <p className="font-medium text-foreground text-xs sm:text-sm truncate mb-1.5 sm:mb-2">
              {entry.mealName}
            </p>
            
            {/* Macros row with color-coded dots */}
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="flex items-center gap-0.5 sm:gap-1 text-foreground font-medium">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-foreground/70"></span>
                {entry.calories}
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 text-primary font-medium">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary"></span>
                {Math.round(entry.protein)}g
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 text-accent font-medium">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent"></span>
                {Math.round(entry.carbs)}g
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 text-secondary font-medium">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary"></span>
                {Math.round(entry.fat)}g
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
