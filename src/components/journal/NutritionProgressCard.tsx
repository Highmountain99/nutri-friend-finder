import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NutrientKey = "cal" | "pro" | "carb" | "fat";

const NUTRIENT_META: Record<
  NutrientKey,
  { badge: string; pattern: "solid" | "ticked" | "hatched" | "dotted"; colorVar: string }
> = {
  cal: { badge: "KCAL", pattern: "solid", colorVar: "--nutrient-cal" },
  pro: { badge: "PRO", pattern: "ticked", colorVar: "--nutrient-pro" },
  carb: { badge: "CARB", pattern: "hatched", colorVar: "--nutrient-carb" },
  fat: { badge: "FAT", pattern: "dotted", colorVar: "--nutrient-fat" },
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
  icon: Icon,
  label,
  remaining,
  goal,
  unit,
  nutrient,
}: NutritionProgressCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const consumed = goal - remaining;
  const percentage = Math.min(Math.max((consumed / goal) * 100, 0), 100);
  const isOverGoal = remaining < 0;

  const accent = `hsl(var(${meta.colorVar}))`;
  const fillColor = isOverGoal ? "hsl(var(--destructive))" : accent;
  const patternClass =
    meta.pattern === "solid" ? "" : `gf-bar__fill--${meta.pattern}`;

  return (
    <div className="relative bg-beige-2 border border-border rounded-[10px] p-3 sm:p-3.5 flex flex-col gap-2.5">
      {/* Top color tab */}
      <span
        className="absolute top-0 left-3.5 w-7 h-[3px] rounded-b-[3px]"
        style={{ background: accent }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-7 h-7 rounded-full grid place-items-center shrink-0"
          style={{ background: accent }}
        >
          <Icon className="w-3.5 h-3.5 text-background" strokeWidth={1.8} />
        </span>
        <span className="text-[12px] text-primary truncate">{label} kvar</span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[28px] sm:text-[30px] font-semibold leading-none tracking-tight tabular-nums"
          )}
          style={{ color: isOverGoal ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}
        >
          {isOverGoal ? "+" : ""}
          {Math.abs(Math.round(remaining)).toLocaleString("sv-SE")}
        </span>
        <span className="text-[11px] text-primary/70">{unit}</span>
      </div>

      {/* Patterned progress bar */}
      <div className="gf-bar">
        <div
          className={cn("gf-bar__fill", patternClass)}
          style={
            {
              width: `${percentage}%`,
              ["--gf-bar-color" as any]: fillColor,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
