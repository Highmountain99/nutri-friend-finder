import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product, ScanHistoryEntry } from "@/types/scanner";

interface ScannerHistoryContextType {
  history: ScanHistoryEntry[];
  addToHistory: (product: Product) => void;
  selectedForCompare: string[];
  toggleCompare: (code: string) => void;
  clearCompare: () => void;
}

const ScannerHistoryContext = createContext<ScannerHistoryContextType | null>(null);

export function ScannerHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const addToHistory = useCallback((product: Product) => {
    setHistory((prev) => {
      if (prev.some((e) => e.product.code === product.code)) return prev;
      return [{ product, scannedAt: new Date() }, ...prev];
    });
  }, []);

  const toggleCompare = useCallback((code: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : prev.length < 3
          ? [...prev, code]
          : prev
    );
  }, []);

  const clearCompare = useCallback(() => setSelectedForCompare([]), []);

  return (
    <ScannerHistoryContext.Provider value={{ history, addToHistory, selectedForCompare, toggleCompare, clearCompare }}>
      {children}
    </ScannerHistoryContext.Provider>
  );
}

export function useScannerHistory() {
  const ctx = useContext(ScannerHistoryContext);
  if (!ctx) throw new Error("useScannerHistory must be used within ScannerHistoryProvider");
  return ctx;
}
