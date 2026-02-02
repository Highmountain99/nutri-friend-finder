import { useState, useRef, useCallback } from "react";
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
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false);

  const SWIPE_THRESHOLD = 80;
  const EXIT_DISTANCE = 400;

  const handleSwipeComplete = useCallback((direction: "left" | "right") => {
    setIsExiting(true);
    setExitDirection(direction);
    
    // Animate off-screen then trigger callback
    setTimeout(() => {
      if (direction === "right") {
        onSave();
      } else {
        onSkip();
      }
      // Reset state after callback
      setSwipeX(0);
      setIsExiting(false);
      setExitDirection(null);
    }, 250);
  }, [onSave, onSkip]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isExiting) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled || isExiting) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }

    // Only track horizontal swipes
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      hasMoved.current = true;
      setSwipeX(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled || isExiting) return;
    setIsDragging(false);
    isHorizontalSwipe.current = null;

    if (swipeX > SWIPE_THRESHOLD) {
      handleSwipeComplete("right");
    } else if (swipeX < -SWIPE_THRESHOLD) {
      handleSwipeComplete("left");
    } else {
      // Spring back to center
      setSwipeX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isExiting) return;
    startX.current = e.clientX;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled || isExiting) return;
    const diff = e.clientX - startX.current;
    if (Math.abs(diff) > 5) {
      hasMoved.current = true;
    }
    setSwipeX(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled || isExiting) return;
    setIsDragging(false);

    if (swipeX > SWIPE_THRESHOLD) {
      handleSwipeComplete("right");
    } else if (swipeX < -SWIPE_THRESHOLD) {
      handleSwipeComplete("left");
    } else {
      setSwipeX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging && !isExiting) {
      setIsDragging(false);
      if (swipeX > SWIPE_THRESHOLD) {
        handleSwipeComplete("right");
      } else if (swipeX < -SWIPE_THRESHOLD) {
        handleSwipeComplete("left");
      } else {
        setSwipeX(0);
      }
    }
  };

  const handleCardClick = () => {
    if (!hasMoved.current && !isDragging && !isExiting) {
      onTap();
    }
  };

  // Calculate visual effects
  const displayX = isExiting 
    ? (exitDirection === "right" ? EXIT_DISTANCE : -EXIT_DISTANCE) 
    : swipeX;
  const rotation = displayX / 25;
  const opacity = isExiting ? 0 : Math.max(0.6, 1 - Math.abs(swipeX) / 400);

  // Progress towards threshold (0 to 1)
  const swipeProgress = Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "shadow-elevated overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y",
        isDragging && "shadow-lg",
        isExiting && "pointer-events-none"
      )}
      style={{
        transform: `translateX(${displayX}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
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
          className="relative h-48 bg-muted"
          onClick={handleCardClick}
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

          {/* Swipe indicators with progressive opacity */}
          <div 
            className="absolute inset-0 bg-primary/30 flex items-center justify-center transition-opacity duration-150"
            style={{ opacity: swipeX > 30 ? swipeProgress : 0 }}
          >
            <div 
              className="bg-primary text-primary-foreground rounded-full p-4 transition-transform duration-150"
              style={{ transform: `scale(${0.8 + swipeProgress * 0.4})` }}
            >
              <Heart className="w-8 h-8" />
            </div>
          </div>
          <div 
            className="absolute inset-0 bg-destructive/30 flex items-center justify-center transition-opacity duration-150"
            style={{ opacity: swipeX < -30 ? swipeProgress : 0 }}
          >
            <div 
              className="bg-destructive text-destructive-foreground rounded-full p-4 transition-transform duration-150"
              style={{ transform: `scale(${0.8 + swipeProgress * 0.4})` }}
            >
              <X className="w-8 h-8" />
            </div>
          </div>

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
        <div className="p-4 space-y-3" onClick={handleCardClick}>
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
              if (!isExiting) handleSwipeComplete("left");
            }}
            disabled={disabled || isExiting}
          >
            <X className="w-4 h-4" />
            Hoppa över
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              if (!isExiting) handleSwipeComplete("right");
            }}
            disabled={disabled || isExiting}
          >
            <Heart className="w-4 h-4" />
            Spara
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
