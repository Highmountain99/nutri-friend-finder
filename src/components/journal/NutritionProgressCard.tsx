import { LucideIcon } from "lucide-react";

export type NutrientKey = "cal" | "pro" | "carb" | "fat";

const NUTRIENT_COLOR: Record<NutrientKey, string> = {
  cal: "--nutrient-cal",
  pro: "--nutrient-pro",
  carb: "--nutrient-carb",
  fat: "--nutrient-fat",
};

interface NutritionProgressCardProps {
  icon: LucideIcon;
  label: string;
  remaining: number;
  goal: number;
  unit: string;
  nutrient: NutrientKey;
}

export function NutritionProgressCard({
  label,
  remaining,
  goal,
  unit,
  nutrient,
}: NutritionProgressCardProps) {
  const consumed = goal - remaining;
  const percentage = Math.min(Math.max((consumed / goal) * 100, 0), 100);
  const isOverGoal = remaining < 0;

  const accent = `hsl(var(${NUTRIENT_COLOR[nutrient]}))`;
  const fillColor = isOverGoal ? "hsl(var(--destructive))" : accent;

  return (
    <div className="bg-card rounded-card p-4 flex flex-col gap-2">
      <span className="text-[13px] text-primary/60 font-semibold">{label}</span>

      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[30px] font-bold leading-none tabular-nums"
          style={{ color: isOverGoal ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}
        >
          {isOverGoal ? "+" : ""}
          {Math.abs(Math.round(remaining)).toLocaleString("sv-SE")}
        </span>
        <span className="text-[13px] font-bold text-primary/70">
          {unit} {isOverGoal ? "över" : "kvar"}
        </span>
      </div>

      <div className="h-2 w-full rounded-pill bg-primary/10 overflow-hidden mt-1">
        <div
          className="h-full rounded-pill transition-all duration-300"
          style={{ width: `${percentage}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}
