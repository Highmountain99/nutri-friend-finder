import { useRef, useCallback, useEffect } from "react";
import { Clock, Users, Heart, X, Flame, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SuggestedRecipe } from "@/hooks/useSuggestedRecipes";

interface SuggestedRecipeCardProps {
  recipe: SuggestedRecipe;
  onSave: () => void;
  onDismiss: () => void;
  onTap: () => void;
  disabled?: boolean;
}

export function SuggestedRecipeCard({
  recipe,
  onSave,
  onDismiss,
  onTap,
  disabled,
}: SuggestedRecipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const overlayRightRef = useRef<HTMLDivElement>(null);
  const overlayLeftRef = useRef<HTMLDivElement>(null);
  const iconRightRef = useRef<HTMLDivElement>(null);
  const iconLeftRef = useRef<HTMLDivElement>(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);
  const hasMoved = useRef(false);
  const isExiting = useRef(false);
  const rafId = useRef(0);

  const SWIPE_THRESHOLD = 80;

  const applyTransform = useCallback((x: number, animated = false) => {
    const card = cardRef.current;
    if (!card) return;
    const rotation = x / 25;
    const opacity = Math.max(0.6, 1 - Math.abs(x) / 400);
    const progress = Math.min(1, Math.abs(x) / SWIPE_THRESHOLD);

    card.style.transition = animated
      ? "transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease"
      : "none";
    card.style.transform = `translateX(${x}px) rotate(${rotation}deg)`;
    card.style.opacity = String(opacity);
    card.style.willChange = animated ? "auto" : "transform, opacity";

    if (overlayRightRef.current) overlayRightRef.current.style.opacity = String(x > 30 ? progress : 0);
    if (overlayLeftRef.current) overlayLeftRef.current.style.opacity = String(x < -30 ? progress : 0);
    if (iconRightRef.current) iconRightRef.current.style.transform = `scale(${0.8 + progress * 0.4})`;
    if (iconLeftRef.current) iconLeftRef.current.style.transform = `scale(${0.8 + progress * 0.4})`;
  }, []);

  const animateExit = useCallback((direction: "left" | "right") => {
    if (isExiting.current) return;
    isExiting.current = true;
    const target = direction === "right" ? 400 : -400;
    const card = cardRef.current;
    if (card) {
      card.style.transition = "transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease";
      card.style.transform = `translateX(${target}px) rotate(${target / 25}deg)`;
      card.style.opacity = "0";
      card.style.pointerEvents = "none";
    }
    setTimeout(() => {
      if (direction === "right") onSave();
      else onDismiss();
      isExiting.current = false;
      if (card) {
        card.style.pointerEvents = "";
        card.style.transition = "none";
        card.style.transform = "translateX(0) rotate(0)";
        card.style.opacity = "1";
      }
    }, 280);
  }, [onSave, onDismiss]);

  useEffect(() => {
    currentX.current = 0;
    applyTransform(0, false);
    const card = cardRef.current;
    if (card) {
      card.style.opacity = "1";
      card.style.transform = "translateX(0) rotate(0)";
    }
  }, [recipe.id, applyTransform]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || isExiting.current) return;
    isDragging.current = true;
    isHorizontal.current = null;
    hasMoved.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentX.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [disabled]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || disabled || isExiting.current) return;
    const diffX = e.clientX - startX.current;
    const diffY = e.clientY - startY.current;

    if (isHorizontal.current === null && (Math.abs(diffX) > 8 || Math.abs(diffY) > 8)) {
      isHorizontal.current = Math.abs(diffX) > Math.abs(diffY);
    }

    if (isHorizontal.current) {
      hasMoved.current = true;
      currentX.current = diffX;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => applyTransform(diffX));
    }
  }, [disabled, applyTransform]);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current || isExiting.current) return;
    isDragging.current = false;
    cancelAnimationFrame(rafId.current);

    const x = currentX.current;
    if (x > SWIPE_THRESHOLD) animateExit("right");
    else if (x < -SWIPE_THRESHOLD) animateExit("left");
    else { currentX.current = 0; applyTransform(0, true); }
    isHorizontal.current = null;
  }, [animateExit, applyTransform]);

  const handleCardClick = useCallback(() => {
    if (!hasMoved.current && !isExiting.current) onTap();
  }, [onTap]);

  return (
    <Card
      ref={cardRef}
      className="shadow-elevated overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y relative z-10"
      style={{ willChange: "transform, opacity" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <CardContent className="p-0">
        <div className="relative h-48 bg-muted" onClick={handleCardClick}>
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Ingen bild</span>
            </div>
          )}

          <div ref={overlayRightRef} className="absolute inset-0 bg-primary/30 flex items-center justify-center" style={{ opacity: 0 }}>
            <div ref={iconRightRef} className="bg-primary text-primary-foreground rounded-full p-4">
              <Heart className="w-8 h-8" />
            </div>
          </div>
          <div ref={overlayLeftRef} className="absolute inset-0 bg-destructive/30 flex items-center justify-center" style={{ opacity: 0 }}>
            <div ref={iconLeftRef} className="bg-destructive text-destructive-foreground rounded-full p-4">
              <X className="w-8 h-8" />
            </div>
          </div>

          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center rounded-full backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(237, 241, 229, 0.92)",
                color: "#1F3A2E",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
              }}
            >
              {recipe.dietitianName.split(" ")[0]} föreslår
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3" onClick={handleCardClick}>
          <h3 className="font-semibold text-lg text-foreground line-clamp-2">{recipe.title}</h3>
          {recipe.message && <p className="text-sm text-muted-foreground italic line-clamp-2">"{recipe.message}"</p>}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {recipe.time_minutes && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{recipe.time_minutes} min</span>}
            {recipe.servings && <span className="flex items-center gap-1"><Users className="w-4 h-4" />{recipe.servings} port</span>}
            {recipe.rating && <span className="flex items-center gap-1">⭐ {recipe.rating.toFixed(1)}</span>}
          </div>
          {(recipe.calories_per_serving || recipe.protein_per_serving) && (
            <div className="flex items-center gap-4 text-sm">
              {recipe.calories_per_serving && <span className="flex items-center gap-1 text-muted-foreground"><Flame className="w-4 h-4 text-accent" />{recipe.calories_per_serving} kcal</span>}
              {recipe.protein_per_serving && <span className="flex items-center gap-1 text-muted-foreground"><Dumbbell className="w-4 h-4 text-primary" />{recipe.protein_per_serving}g protein</span>}
            </div>
          )}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {recipe.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 pt-0">
          <Button variant="outline" className="flex-1 gap-2"
            onClick={(e) => { e.stopPropagation(); animateExit("left"); }}
            disabled={disabled}>
            <X className="w-4 h-4" />Inte nu
          </Button>
          <Button className="flex-1 gap-2"
            onClick={(e) => { e.stopPropagation(); animateExit("right"); }}
            disabled={disabled}>
            <Heart className="w-4 h-4" />Spara
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
