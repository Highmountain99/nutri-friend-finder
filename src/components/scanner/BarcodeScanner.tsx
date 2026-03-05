import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Search, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProduct } from "@/lib/api/openFoodFacts";
import { ProductSearchInput } from "./ProductSearchInput";
import type { Product } from "@/types/scanner";

interface BarcodeScannerProps {
  onProductFound: (product: Product) => void;
  onOpenHistory: () => void;
}

const DEMO_BARCODES = [
  { label: "Testa: Barilla Pasta", code: "8076802085738" },
  { label: "Testa: Coca-Cola", code: "5449000000996" },
  { label: "Testa: Wasa Knäckebröd", code: "7300400126007" },
];

export function BarcodeScanner({ onProductFound, onOpenHistory }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const onProductFoundRef = useRef(onProductFound);
  onProductFoundRef.current = onProductFound;

  const lookup = useCallback(async (barcode: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      if (navigator.vibrate) navigator.vibrate(200);
      const result = await fetchProduct(barcode.trim());
      if (result.found && result.product) {
        onProductFoundRef.current(result.product);
      } else {
        setError("Produkten hittades inte i databasen. Prova att skanna igen eller skriv in koden manuellt.");
      }
    } catch {
      setError("Kunde inte hämta produktdata. Kontrollera din internetanslutning.");
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    let stopped = false;

    async function startScanner() {
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
        ];

        html5Qrcode = new Html5Qrcode("scanner-region", {
          formatsToSupport,
          useBarCodeDetectorIfSupported: false,
          verbose: false,
        });
        scannerRef.current = html5Qrcode;

        // Compute responsive qrbox based on container width
        const container = document.getElementById("scanner-region");
        const containerWidth = container?.clientWidth || 320;
        const qrboxWidth = Math.min(280, containerWidth - 40);
        const qrboxHeight = Math.round(qrboxWidth * 0.57);

        console.log("[BarcodeScanner] Starting scanner, container:", containerWidth, "qrbox:", qrboxWidth, "x", qrboxHeight);

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: qrboxWidth, height: qrboxHeight },
          },
          (decodedText) => {
            console.log("[BarcodeScanner] Decoded:", decodedText);
            if (!stopped) lookup(decodedText);
          },
          () => {}
        );
        console.log("[BarcodeScanner] Camera started successfully");
      } catch (err) {
        console.error("[BarcodeScanner] Failed to start:", err);
        setCameraAvailable(false);
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (html5Qrcode?.isScanning) {
        html5Qrcode.stop().catch(() => {});
      }
    };
  }, [lookup]);

  const handleManualSearch = () => {
    if (manualCode.trim()) lookup(manualCode);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Camera area */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[16/10]">
        <div id="scanner-region" ref={containerRef} className="w-full h-full" />
        {!cameraAvailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground text-sm p-4 text-center">
            <ScanLine className="h-10 w-10 mb-2 opacity-50" />
            <p>Kamera ej tillgänglig.</p>
            <p className="text-xs mt-1">Använd manuell inmatning eller demoknappar nedan.</p>
          </div>
        )}
        {/* Scanning animation overlay */}
        {cameraAvailable && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[280px] h-[160px] border-2 border-primary/60 rounded-lg relative overflow-hidden">
              <div className="absolute left-0 right-0 h-0.5 bg-primary animate-scanner-line" />
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">Skanna streckkoden på produkten</p>

      {/* Product name search */}
      <ProductSearchInput onProductSelected={onProductFound} />

      {/* Manual barcode input */}
      <div className="flex gap-2">
        <Input
          placeholder="Eller skriv in streckkod manuellt..."
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          className="rounded-full"
        />
        <Button onClick={handleManualSearch} size="icon" className="rounded-full shrink-0" disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Demo buttons */}
      <div className="flex flex-col gap-2">
        {DEMO_BARCODES.map((demo) => (
          <Button key={demo.code} variant="outline" className="rounded-full text-xs" size="sm" onClick={() => lookup(demo.code)} disabled={loading}>
            {demo.label}
          </Button>
        ))}
      </div>

      {/* History link */}
      <button onClick={onOpenHistory} className="text-sm text-primary underline-offset-4 hover:underline self-center">
        Sökhistorik
      </button>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Hämtar produktdata...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive text-center">
          {error}
        </div>
      )}
    </div>
  );
}
