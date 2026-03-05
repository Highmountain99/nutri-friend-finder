import { ArrowLeft, ScanLine, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/scanner";
import { NutriScoreDisplay } from "./NutriScoreDisplay";
import { NovaGroupDisplay } from "./NovaGroupDisplay";
import { NutritionTable } from "./NutritionTable";
import { MacroDonutChart } from "./MacroDonutChart";
import { AllergenBadges } from "./AllergenBadges";
import { IngredientsCollapsible } from "./IngredientsCollapsible";
import { useScannerHistory } from "@/contexts/ScannerHistoryContext";

interface ProductViewProps {
  product: Product;
  onBack: () => void;
  onScanNew: () => void;
}

export function ProductView({ product, onBack, onScanNew }: ProductViewProps) {
  const { addToHistory, history } = useScannerHistory();
  const isSaved = history.some((e) => e.product.code === product.code);

  return (
    <div className="flex flex-col gap-4 pb-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground self-start">
        <ArrowLeft className="h-4 w-4" /> Tillbaka
      </button>

      {/* Header */}
      <div className="flex gap-4 items-start">
        {product.image_front_url ? (
          <img src={product.image_front_url} alt={product.product_name} className="w-24 h-24 rounded-2xl object-cover bg-muted" />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-xs">Ingen bild</div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground leading-tight">{product.product_name}</h2>
          {product.brands && <p className="text-sm text-muted-foreground">{product.brands}</p>}
          {product.quantity && <p className="text-xs text-muted-foreground">{product.quantity}</p>}
        </div>
      </div>

      {/* Nutri-Score */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">Nutri-Score</h3>
        <NutriScoreDisplay grade={product.nutrition_grades} />
      </div>

      {/* NOVA */}
      {product.nova_group && (
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Bearbetningsgrad</h3>
          <NovaGroupDisplay group={product.nova_group} />
        </div>
      )}

      {/* Nutrition */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Näringsvärden per 100g</h3>
        <NutritionTable nutriments={product.nutriments} />
      </div>

      {/* Macro chart */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Makronäringsfördelning</h3>
        <MacroDonutChart nutriments={product.nutriments} />
      </div>

      {/* Allergens */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">Allergener</h3>
        <AllergenBadges tags={product.allergens_tags} />
      </div>

      {/* Ingredients */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <IngredientsCollapsible textSv={product.ingredients_text_sv} text={product.ingredients_text} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={onScanNew} className="rounded-full" size="lg">
          <ScanLine className="h-4 w-4 mr-2" /> Skanna ny produkt
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          size="lg"
          disabled={isSaved}
          onClick={() => addToHistory(product)}
        >
          <Save className="h-4 w-4 mr-2" /> {isSaved ? "Sparad i historik" : "Spara i historik"}
        </Button>
      </div>
    </div>
  );
}
