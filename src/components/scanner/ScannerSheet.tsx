import { useState } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Product, ScannerView } from "@/types/scanner";
import { BarcodeScanner } from "./BarcodeScanner";
import { ProductView } from "./ProductView";
import { ScannerHistory } from "./ScannerHistory";
import { ProductCompare } from "./ProductCompare";

interface ScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScannerSheet({ open, onOpenChange }: ScannerSheetProps) {
  const [view, setView] = useState<ScannerView>("scanner");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const handleProductFound = (product: Product) => {
    setCurrentProduct(product);
    setView("product");
  };

  const handleScanNew = () => {
    setCurrentProduct(null);
    setView("scanner");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setView("scanner");
      setCurrentProduct(null);
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95dvh] rounded-t-3xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Livsmedelsskanner</h2>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {view === "scanner" && (
              <BarcodeScanner onProductFound={handleProductFound} onOpenHistory={() => setView("history")} />
            )}
            {view === "product" && currentProduct && (
              <ProductView product={currentProduct} onBack={() => setView("scanner")} onScanNew={handleScanNew} />
            )}
            {view === "history" && (
              <ScannerHistory
                onBack={() => setView("scanner")}
                onSelectProduct={(p) => { setCurrentProduct(p); setView("product"); }}
                onCompare={() => setView("compare")}
              />
            )}
            {view === "compare" && (
              <ProductCompare onBack={() => setView("history")} />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
