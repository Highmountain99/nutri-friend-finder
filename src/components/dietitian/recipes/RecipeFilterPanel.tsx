import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, X } from "lucide-react";
import { TAG_GROUPS, type TagGroup } from "@/lib/recipeTags";

export interface RecipeFilterState {
  cuisine_types: string[];
  meal_types: string[];
  health_plans: string[];
  dietary_needs: string[];
  allergen_free: string[];
  search: string;
}

export const emptyFilterState: RecipeFilterState = {
  cuisine_types: [],
  meal_types: [],
  health_plans: [],
  dietary_needs: [],
  allergen_free: [],
  search: "",
};

interface RecipeFilterPanelProps {
  filters: RecipeFilterState;
  onChange: (filters: RecipeFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function RecipeFilterPanel({ filters, onChange, totalCount, filteredCount }: RecipeFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    filters.cuisine_types.length +
    filters.meal_types.length +
    filters.health_plans.length +
    filters.dietary_needs.length +
    filters.allergen_free.length;

  const toggleTag = (groupKey: string, tagId: string) => {
    const group = TAG_GROUPS.find((g) => g.key === groupKey);
    if (!group) return;
    const col = group.dbColumn as keyof RecipeFilterState;
    const current = filters[col] as string[];
    const next = current.includes(tagId)
      ? current.filter((t) => t !== tagId)
      : [...current, tagId];
    onChange({ ...filters, [col]: next });
  };

  const clearAll = () => onChange({ ...emptyFilterState, search: "" });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-3 flex-wrap">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {activeCount > 0 && (
              <Badge className="ml-1 h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {activeCount}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök recept på namn eller ingrediens..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Visar {filteredCount} av {totalCount} recept
        </span>
      </div>

      <CollapsibleContent className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 border rounded-xl bg-muted/30">
          {TAG_GROUPS.map((group) => (
            <FilterGroup
              key={group.key}
              group={group}
              selected={filters[group.dbColumn as keyof RecipeFilterState] as string[]}
              onToggle={(tagId) => toggleTag(group.key, tagId)}
            />
          ))}
        </div>
        <div className="flex justify-end mt-3">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={clearAll}>
              <X className="h-3.5 w-3.5 mr-1" />
              Rensa filter
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FilterGroup({
  group,
  selected,
  onToggle,
}: {
  group: TagGroup;
  selected: string[];
  onToggle: (tagId: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
      <div className="flex flex-wrap gap-1.5">
        {group.options.map((opt) => {
          const isActive = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground border border-border hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
