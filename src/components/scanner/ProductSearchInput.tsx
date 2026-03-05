import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchProducts } from "@/lib/api/openFoodFacts";
import type { Product } from "@/types/scanner";

interface ProductSearchInputProps {
  onProductSelected: (product: Product) => void;
}

const NUTRI_COLORS: Record<string, string> = {
  a: "bg-[#1E8F4E]",
  b: "bg-[#60AC0E]",
  c: "bg-[#EEAE0E]",
  d: "bg-[#FF6F1E]",
  e: "bg-[#E63E11]",
};

export function ProductSearchInput({ onProductSelected }: ProductSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    try {
      const products = await searchProducts(q.trim());
      setResults(products);
      setShowResults(products.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (product: Product) => {
    setShowResults(false);
    setQuery("");
    setResults([]);
    onProductSelected(product);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök produkt, t.ex. 'Coca Cola Zero 330ml'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="rounded-full pl-9 pr-9"
        />
        {loading && <Loader2 className="absolute right-3 h-4 w-4 text-muted-foreground animate-spin" />}
        {!loading && query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
            className="absolute right-3 p-0.5"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-2xl border border-border bg-background shadow-lg">
          {results.map((product, i) => (
            <button
              key={`${product.code}-${i}`}
              onClick={() => handleSelect(product)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              {product.image_front_small_url ? (
                <img
                  src={product.image_front_small_url}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{product.product_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[product.brands, product.quantity].filter(Boolean).join(" · ")}
                </p>
              </div>
              {product.nutrition_grades && (
                <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded ${NUTRI_COLORS[product.nutrition_grades]}`}>
                  {product.nutrition_grades.toUpperCase()}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
