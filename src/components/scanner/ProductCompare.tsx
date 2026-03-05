import { ArrowLeft } from "lucide-react";
import { useScannerHistory } from "@/contexts/ScannerHistoryContext";
import { NutriScoreDisplay } from "./NutriScoreDisplay";
import {
  getFatColor, getSaturatedFatColor, getSugarColor,
  getSaltColor, getFiberColor, getProteinColor, trafficLightClasses,
} from "@/lib/scanner/nutritionThresholds";

interface ProductCompareProps {
  onBack: () => void;
}

function fmt(v?: number): string {
  if (v == null) return "–";
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

const rows: { label: string; key: string; unit: string; colorFn: ((v?: number) => any) | null; lower: boolean }[] = [
  { label: "Energi", key: "energy-kcal_100g", unit: "kcal", colorFn: null, lower: true },
  { label: "Fett", key: "fat_100g", unit: "g", colorFn: getFatColor, lower: true },
  { label: "Mättat fett", key: "saturated-fat_100g", unit: "g", colorFn: getSaturatedFatColor, lower: true },
  { label: "Socker", key: "sugars_100g", unit: "g", colorFn: getSugarColor, lower: true },
  { label: "Fiber", key: "fiber_100g", unit: "g", colorFn: getFiberColor, lower: false },
  { label: "Protein", key: "proteins_100g", unit: "g", colorFn: getProteinColor, lower: false },
  { label: "Salt", key: "salt_100g", unit: "g", colorFn: getSaltColor, lower: true },
];

export function ProductCompare({ onBack }: ProductCompareProps) {
  const { history, selectedForCompare } = useScannerHistory();
  const products = history.filter((e) => selectedForCompare.includes(e.product.code)).map((e) => e.product);

  if (products.length < 2) return null;

  function bestIdx(key: string, lower: boolean) {
    const vals = products.map((p) => (p.nutriments as any)[key] as number | undefined);
    let bestI = 0;
    let bestV = vals[0] ?? (lower ? Infinity : -Infinity);
    vals.forEach((v, i) => {
      if (v == null) return;
      if (lower ? v < bestV : v > bestV) { bestV = v; bestI = i; }
    });
    return vals[bestI] != null ? bestI : -1;
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground self-start">
        <ArrowLeft className="h-4 w-4" /> Tillbaka
      </button>
      <h2 className="text-lg font-bold text-foreground">Jämför produkter</h2>

      {/* Header row */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${products.length}, 1fr)` }}>
        <div />
        {products.map((p) => (
          <div key={p.code} className="text-center">
            {p.image_front_small_url ? (
              <img src={p.image_front_small_url} alt="" className="w-14 h-14 rounded-xl object-cover mx-auto bg-muted" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-muted mx-auto" />
            )}
            <p className="text-xs font-medium text-foreground mt-1 truncate">{p.product_name}</p>
            <div className="mt-1 flex justify-center"><NutriScoreDisplay grade={p.nutrition_grades} /></div>
          </div>
        ))}
      </div>

      {/* Data rows */}
      <div className="border border-border rounded-2xl overflow-hidden">
        {rows.map((row) => {
          const best = row.colorFn ? bestIdx(row.key, row.lower!) : -1;
          return (
            <div key={row.key} className="grid border-b border-border last:border-b-0" style={{ gridTemplateColumns: `120px repeat(${products.length}, 1fr)` }}>
              <div className="text-xs text-muted-foreground py-2 px-3 flex items-center">{row.label}</div>
              {products.map((p, i) => {
                const v = (p.nutriments as any)[row.key] as number | undefined;
                return (
                  <div
                    key={p.code}
                    className={`text-xs font-medium py-2 px-2 text-center flex items-center justify-center ${i === best ? "bg-green-500/10" : ""}`}
                  >
                    {fmt(v)} {v != null ? row.unit : ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
