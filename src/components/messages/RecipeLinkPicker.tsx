import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecipeLinkPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (recipe: { id: string; title: string; image_url?: string | null }) => void;
}

export function RecipeLinkPicker({ open, onOpenChange, onSelect }: RecipeLinkPickerProps) {
  const [search, setSearch] = useState("");

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipe-picker", search],
    queryFn: async () => {
      let query = supabase
        .from("recipes")
        .select("id, title, image_url")
        .order("title")
        .limit(20);
      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Välj recept</SheetTitle>
        </SheetHeader>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök recept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex-1 overflow-y-auto mt-3 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : recipes?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Inga recept hittades.</p>
          ) : (
            recipes?.map((r) => (
              <button
                key={r.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => onSelect(r)}
              >
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 shrink-0" />
                )}
                <span className="text-sm font-medium truncate">{r.title}</span>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
