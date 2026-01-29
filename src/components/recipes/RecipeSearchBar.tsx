import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RecipeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick: () => void;
}

export function RecipeSearchBar({ value, onChange, onFilterClick }: RecipeSearchBarProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Sök recept..."
          className="pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Button variant="outline" size="icon" onClick={onFilterClick}>
        <SlidersHorizontal className="w-4 h-4" />
      </Button>
    </div>
  );
}
