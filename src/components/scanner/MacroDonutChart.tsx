import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ProductNutriments } from "@/types/scanner";

interface MacroDonutChartProps {
  nutriments: ProductNutriments;
}

export function MacroDonutChart({ nutriments }: MacroDonutChartProps) {
  const protein = nutriments.proteins_100g ?? 0;
  const carbs = nutriments.carbohydrates_100g ?? 0;
  const fat = nutriments.fat_100g ?? 0;
  const total = protein + carbs + fat;
  const kcal = nutriments["energy-kcal_100g"];

  if (total === 0) return null;

  const data = [
    { name: "Protein", value: protein, color: "#3B82F6" },
    { name: "Kolhydrater", value: carbs, color: "#F59E0B" },
    { name: "Fett", value: fat, color: "#EF4444" },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-40">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={2} strokeWidth={0}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {kcal != null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-foreground">{Math.round(kcal)}</span>
            <span className="text-[10px] text-muted-foreground">kcal</span>
          </div>
        )}
      </div>
      <div className="flex gap-4 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.name} {total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
