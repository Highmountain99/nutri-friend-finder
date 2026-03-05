import type { ProductNutriments } from "@/types/scanner";
import {
  getFatColor, getSaturatedFatColor, getSugarColor,
  getSaltColor, getFiberColor, getProteinColor, trafficLightClasses,
} from "@/lib/scanner/nutritionThresholds";

interface NutritionTableProps {
  nutriments: ProductNutriments;
}

function fmt(v?: number): string {
  if (v == null) return "–";
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

export function NutritionTable({ nutriments }: NutritionTableProps) {
  const rows: { label: string; value?: number; unit: string; indent?: boolean; colorFn: (v?: number) => string }[] = [
    { label: "Energi", value: nutriments["energy-kcal_100g"], unit: "kcal", colorFn: () => "text-foreground" },
    { label: "Fett", value: nutriments.fat_100g, unit: "g", colorFn: (v) => trafficLightClasses[getFatColor(v)] },
    { label: "– varav mättat fett", value: nutriments["saturated-fat_100g"], unit: "g", indent: true, colorFn: (v) => trafficLightClasses[getSaturatedFatColor(v)] },
    { label: "Kolhydrater", value: nutriments.carbohydrates_100g, unit: "g", colorFn: () => "text-foreground" },
    { label: "– varav socker", value: nutriments.sugars_100g, unit: "g", indent: true, colorFn: (v) => trafficLightClasses[getSugarColor(v)] },
    { label: "Fiber", value: nutriments.fiber_100g, unit: "g", colorFn: (v) => trafficLightClasses[getFiberColor(v)] },
    { label: "Protein", value: nutriments.proteins_100g, unit: "g", colorFn: (v) => trafficLightClasses[getProteinColor(v)] },
    { label: "Salt", value: nutriments.salt_100g, unit: "g", colorFn: (v) => trafficLightClasses[getSaltColor(v)] },
  ];

  return (
    <div className="space-y-0">
      {rows.map((row) => (
        <div key={row.label} className={`flex items-center justify-between py-2 border-b border-border ${row.indent ? "pl-4" : ""}`}>
          <span className="text-sm text-foreground">{row.label}</span>
          <span className={`text-sm font-medium ${row.colorFn(row.value)}`}>
            {fmt(row.value)} {row.value != null ? row.unit : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
