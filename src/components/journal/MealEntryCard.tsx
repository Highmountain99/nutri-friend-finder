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
  
  // Build visible macros array — Hybrid (jord + mönster) accents
  const visibleMacros = [
    showCalories && {
      value: entry.calories,
      unit: "",
      letter: "K",
      color: "bg-nutrient-cal",
    },
    showProtein && {
      value: Math.round(entry.protein),
      unit: "g",
      letter: "P",
      color: "bg-nutrient-pro",
    },
    showCarbs && {
      value: Math.round(entry.carbs),
      unit: "g",
      letter: "C",
      color: "bg-nutrient-carb",
    },
    showFat && {
      value: Math.round(entry.fat),
      unit: "g",
      letter: "F",
      color: "bg-nutrient-fat",
    },
  ].filter(Boolean) as Array<{ value: number; unit: string; letter: string; color: string }>;

  return (
    <Card
      className="shadow-soft cursor-pointer hover:shadow-md transition-shadow bg-beige-2"
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
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-primary/65">
                {entry.mealType} • {timeStr}
              </span>
            </div>

            <p className="font-medium text-primary text-sm truncate mb-1.5">
              {entry.mealName}
            </p>

            {/* Macros row — patterned-dot + letter + value */}
            {visibleMacros.length > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap">
                {visibleMacros.map((macro, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-primary/75"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${macro.color}`} />
                    <b className="font-bold">{macro.letter}</b>
                    <span>{macro.value}{macro.unit}</span>
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

