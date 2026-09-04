import { Camera } from "lucide-react";
import type { NutritionEntry } from "@/hooks/useJournalData";
import { useMealImage } from "@/lib/mealImages";
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

const TILE_TONES = ["bg-gold", "bg-sage", "bg-apricot", "bg-leaf"];

export function MealEntryCard({
  entry,
  onClick,
  showCalories = true,
  showProtein = true,
  showCarbs = true,
  showFat = true,
}: MealEntryCardProps) {
  const timeStr = format(new Date(entry.createdAt), "HH:mm", { locale: sv });
  const imageSrc = useMealImage(entry.imageUrl);

  const macroParts = [
    showCalories && `${entry.calories} kcal`,
    showProtein && `P ${Math.round(entry.protein)}`,
    showCarbs && `K ${Math.round(entry.carbs)}`,
    showFat && `F ${Math.round(entry.fat)}`,
  ].filter(Boolean) as string[];

  const tone = TILE_TONES[new Date(entry.createdAt).getHours() % TILE_TONES.length];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card rounded-card p-3 flex items-center gap-3 transition-transform active:scale-[0.99]"
    >
      {/* Time tile / image */}
      <div className={`w-[62px] h-[62px] rounded-2xl overflow-hidden shrink-0 grid place-items-center ${tone}`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={entry.mealName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[14px] font-bold text-primary">{timeStr}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-primary text-[15px] truncate">{entry.mealName}</p>
        <p className="text-[12px] text-primary/60 truncate mt-0.5">
          {entry.imageUrl ? `${timeStr} · ` : ""}
          {macroParts.join(" · ")}
        </p>
      </div>
    </button>
  );
}
