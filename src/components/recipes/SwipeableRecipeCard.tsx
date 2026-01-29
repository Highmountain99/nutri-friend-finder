import { useState, useRef } from "react";
import { Clock, Users, Leaf, Heart, X, Flame, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecipeWithInteraction } from "@/hooks/useDailyPicks";

interface SwipeableRecipeCardProps {
  recipe: RecipeWithInteraction;
  onSave: () => void;
  onSkip: () => void;
  onTap: () => void;
  disabled?: boolean;
}

export function SwipeableRecipeCard({
  recipe,
  onSave,
  onSkip,
  onTap,
  disabled,
}: SwipeableRecipeCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setSwipeX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    if (swipeX > SWIPE_THRESHOLD) {
      onSave();
    } else if (swipeX < -SWIPE_THRESHOLD) {
      onSkip();
    }
    setSwipeX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    const diff = e.clientX - startX.current;
    setSwipeX(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    if (swipeX > SWIPE_THRESHOLD) {
      onSave();
    } else if (swipeX < -SWIPE_THRESHOLD) {
      onSkip();
    }
    setSwipeX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setSwipeX(0);
    }
  };

  const rotation = swipeX / 20;
  const opacity = Math.max(0.5, 1 - Math.abs(swipeX) / 300);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "shadow-elevated overflow-hidden cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "shadow-lg"
      )}
      style={{
        transform: `translateX(${swipeX}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging ? "none" : "transform 0.3s ease, opacity 0.3s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <CardContent className="p-0">
        {/* Image */}
        <div
          className="relative h-48 bg-muted cursor-pointer"
          onClick={() => !isDragging && onTap()}
        >
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Ingen bild</span>
            </div>
          )}

          {/* Swipe indicators */}
          {swipeX > 50 && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="bg-primary text-primary-foreground rounded-full p-4">
                <Heart className="w-8 h-8" />
              </div>
            </div>
          )}
          {swipeX < -50 && (
            <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
              <div className="bg-destructive text-destructive-foreground rounded-full p-4">
                <X className="w-8 h-8" />
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {recipe.is_climate_smart && (
              <Badge className="bg-primary/90 text-primary-foreground gap-1">
                <Leaf className="w-3 h-3" />
                Klimatsmart
              </Badge>
            )}
            {recipe.source === "dietitian" && (
              <Badge variant="secondary" className="bg-accent/90 text-accent-foreground">
                Rekommenderad av dietist
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3" onClick={() => !isDragging && onTap()}>
          <h3 className="font-semibold text-lg text-foreground line-clamp-2">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {recipe.time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.time_minutes} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings} port
              </span>
            )}
            {recipe.rating && (
              <span className="flex items-center gap-1">
                ⭐ {recipe.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Nutrition summary */}
          {(recipe.calories_per_serving || recipe.protein_per_serving) && (
            <div className="flex items-center gap-4 text-sm">
              {recipe.calories_per_serving && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Flame className="w-4 h-4 text-accent" />
                  {recipe.calories_per_serving} kcal
                </span>
              )}
              {recipe.protein_per_serving && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  {recipe.protein_per_serving}g protein
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-4 pt-0">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
            Hoppa över
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            disabled={disabled}
          >
            <Heart className="w-4 h-4" />
            Spara
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
