import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { NutritionEntry } from "@/hooks/useJournalData";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface MealEntryCardProps {
  entry: NutritionEntry;
  onClick?: () => void;
  showCalories?: boolean;
  showProtein?: boolean;
  showCarbs?: boolean;
  showFat?: boolean;
}

export function MealEntryCard({ 
  entry, 
  onClick,
  showCalories = true,
  showProtein = true,
  showCarbs = true,
  showFat = true,
}: MealEntryCardProps) {
  const timeStr = format(new Date(entry.createdAt), "HH:mm", { locale: sv });
  
  // Build visible macros array
  const visibleMacros = [
    showCalories && {
      value: entry.calories,
      unit: "",
      color: "text-foreground",
      bgColor: "bg-foreground/70"
    },
    showProtein && {
      value: Math.round(entry.protein),
      unit: "g",
      color: "text-primary",
      bgColor: "bg-primary"
    },
    showCarbs && {
      value: Math.round(entry.carbs),
      unit: "g",
      color: "text-accent",
      bgColor: "bg-accent"
    },
    showFat && {
      value: Math.round(entry.fat),
      unit: "g",
      color: "text-secondary",
      bgColor: "bg-secondary"
    },
  ].filter(Boolean) as Array<{ value: number; unit: string; color: string; bgColor: string }>;
  
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
            
            {/* Macros row with color-coded dots - only show visible ones */}
            {visibleMacros.length > 0 && (
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                {visibleMacros.map((macro, index) => (
                  <span key={index} className={`flex items-center gap-0.5 sm:gap-1 ${macro.color} font-medium`}>
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${macro.bgColor}`}></span>
                    {macro.value}{macro.unit}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
