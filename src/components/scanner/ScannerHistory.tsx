import { ArrowLeft, PackageSearch, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useScannerHistory } from "@/contexts/ScannerHistoryContext";
import type { Product } from "@/types/scanner";

interface ScannerHistoryProps {
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onCompare: () => void;
}

const nutrisColors: Record<string, string> = {
  a: "bg-[#1E8F4E]", b: "bg-[#60AC0E]", c: "bg-[#EEAE0E]", d: "bg-[#FF6F1E]", e: "bg-[#E63E11]",
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export function ScannerHistory({ onBack, onSelectProduct, onCompare }: ScannerHistoryProps) {
  const { history, selectedForCompare, toggleCompare } = useScannerHistory();

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Tillbaka
        </button>
        {selectedForCompare.length >= 2 && (
          <Button onClick={onCompare} size="sm" className="rounded-full">
            <GitCompareArrows className="h-4 w-4 mr-1" /> Jämför ({selectedForCompare.length})
          </Button>
        )}
      </div>

      <h2 className="text-lg font-bold text-foreground">Sökhistorik</h2>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <PackageSearch className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Du har inte skannat några produkter ännu</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((entry) => (
            <div key={entry.product.code} className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm border border-border">
              <Checkbox
                checked={selectedForCompare.includes(entry.product.code)}
                onCheckedChange={() => toggleCompare(entry.product.code)}
              />
              <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => onSelectProduct(entry.product)}>
                {entry.product.image_front_small_url ? (
                  <img src={entry.product.image_front_small_url} alt="" className="w-12 h-12 rounded-xl object-cover bg-muted" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.product.product_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.product.brands}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {entry.product.nutrition_grades && (
                    <Badge className={`${nutrisColors[entry.product.nutrition_grades]} text-white text-[10px] px-1.5 py-0`}>
                      {entry.product.nutrition_grades.toUpperCase()}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">{formatTime(entry.scannedAt)}</span>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
