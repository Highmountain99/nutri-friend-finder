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
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Image or placeholder */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {entry.imageUrl ? (
              <img 
                src={entry.imageUrl} 
                alt={entry.mealName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Camera className="w-6 h-6 text-primary/50" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">
                {entry.mealType} • {timeStr}
              </span>
              {entry.isAiEstimated && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  AI
                </span>
              )}
            </div>
            
            <p className="font-medium text-foreground text-sm truncate mb-2">
              {entry.mealName}
            </p>
            
            {/* Macros row with color-coded dots */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-foreground font-medium">
                <span className="w-2 h-2 rounded-full bg-foreground/70"></span>
                {entry.calories}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                {Math.round(entry.protein)}g
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {Math.round(entry.carbs)}g
              </span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {Math.round(entry.fat)}g
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
