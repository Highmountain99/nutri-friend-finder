import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Clock, MoreVertical, Send, Pencil, Copy, Trash2, Users, UtensilsCrossed, Bookmark, BookmarkX } from "lucide-react";
import { getTagLabel } from "@/lib/recipeTags";
import type { Tables } from "@/integrations/supabase/types";

type Recipe = Tables<"recipes"> & { is_published?: boolean };

interface DietitianRecipeCardProps {
  recipe: Recipe;
  isOwn?: boolean;
  isSaved?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onSuggest: (id: string) => void;
  onEdit?: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
  onSaveToMine?: (id: string) => void;
  onRemoveFromMine?: (id: string) => void;
  onOpen?: (id: string) => void;
}

export function DietitianRecipeCard({
  recipe,
  isOwn,
  isSaved,
  isSelected,
  onToggleSelect,
  onSuggest,
  onEdit,
  onDuplicate,
  onDelete,
  onSaveToMine,
  onRemoveFromMine,
  onOpen,
}: DietitianRecipeCardProps) {
  const allTags = [
    ...(recipe.cuisine_types || []),
    ...(recipe.meal_types || []),
    ...(recipe.health_plans || []),
    ...(recipe.dietary_needs || []),
    ...(recipe.allergen_free || []),
  ];
  const visibleTags = allTags.slice(0, 3);
  const extraCount = allTags.length - 3;

  const isPublished = (recipe as any).is_published !== false;

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen ? () => onOpen(recipe.id) : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(recipe.id); } } : undefined}
      className={`group relative rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md ${onOpen ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}
    >
      {/* Select checkbox */}
      {onToggleSelect && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className={`absolute top-2 left-2 z-10 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-white/80 bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          }`}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
      )}
      {/* Image */}
      {recipe.image_url ? (
        <div className="h-40 bg-muted">
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-40 bg-primary/5 flex items-center justify-center">
          <UtensilsCrossed className="h-10 w-10 text-primary/20" />
        </div>
      )}

      {/* Badges */}
      <div className={`absolute top-2 flex gap-1 ${onToggleSelect ? "left-9" : "left-2"}`}>
        {!isPublished && (
          <Badge variant="secondary" className="text-[10px]">Utkast</Badge>
        )}
        {isSaved && !isOwn && (
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">Sparad</Badge>
        )}
      </div>

      {/* 3-dot menu */}
      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSuggest(recipe.id)}>
              <Send className="h-3.5 w-3.5 mr-2" /> Föreslå till patient
            </DropdownMenuItem>

            {onSaveToMine && (
              <DropdownMenuItem onClick={() => onSaveToMine(recipe.id)}>
                <Bookmark className="h-3.5 w-3.5 mr-2" /> Lägg till i mina recept
              </DropdownMenuItem>
            )}

            {onRemoveFromMine && (
              <DropdownMenuItem onClick={() => onRemoveFromMine(recipe.id)}>
                <BookmarkX className="h-3.5 w-3.5 mr-2" /> Ta bort från mina recept
              </DropdownMenuItem>
            )}

            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(recipe)}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Redigera
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => onDuplicate(recipe)}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Duplicera
            </DropdownMenuItem>

            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(recipe.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Ta bort
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{recipe.title}</h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          {(recipe.time_minutes || (recipe as any).prep_time_minutes) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {((recipe as any).prep_time_minutes || 0) + (recipe.time_minutes || 0)} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {recipe.servings} portioner
            </span>
          )}
        </div>
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                {getTagLabel(tag)}
              </Badge>
            ))}
            {extraCount > 0 && (
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                +{extraCount} till
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
