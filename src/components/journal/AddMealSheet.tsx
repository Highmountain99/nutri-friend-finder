import React, { useState, useRef } from "react";
import { Camera, Image, Type, Loader2, Check, X, Sparkles, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { OrganicLoader } from "@/components/ui/OrganicLoader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Ingredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dataSource?: "livsmedelsverket" | "ai_estimation";
}

interface FoodEstimation {
  mealName: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  confidence: "high" | "medium" | "low";
  dataSource?: "livsmedelsverket" | "ai_estimation" | "mixed";
}

interface AddMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: {
    mealName: string;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isAiEstimated: boolean;
    imageUrl?: string;
    ingredients?: Ingredient[];
  }) => void;
  initialImage?: string | null;
}

type InputMode = "select" | "camera" | "gallery" | "text";
type ViewState = "input" | "analyzing" | "result";

const MEAL_TYPES = ["Frukost", "Förmiddagssnack", "Lunch", "Mellanmål", "Middag", "Kvällssnack"];

const MACRO_DOT = {
  calories: "bg-terracotta",
  protein: "bg-leaf",
  carbs: "bg-gold",
  fat: "bg-apricot",
} as const;

const CONFIDENCE_STYLE = {
  high: { label: "Hög säkerhet", cls: "bg-leaf" },
  medium: { label: "Medel", cls: "bg-gold" },
  low: { label: "Låg", cls: "bg-apricot" },
} as const;

const QUICK_MULTIPLIERS = [
  { label: "Hälften", value: 0.5 },
  { label: "3/4", value: 0.75 },
  { label: "1.5x", value: 1.5 },
] as const;

function scaleEstimation(base: FoodEstimation, m: number): FoodEstimation {
  return {
    ...base,
    calories: Math.round(base.calories * m),
    protein: Math.round(base.protein * m * 10) / 10,
    carbs: Math.round(base.carbs * m * 10) / 10,
    fat: Math.round(base.fat * m * 10) / 10,
    ingredients: base.ingredients.map((ing) => ({
      ...ing,
      calories: Math.round(ing.calories * m),
      protein: Math.round(ing.protein * m * 10) / 10,
      carbs: Math.round(ing.carbs * m * 10) / 10,
      fat: Math.round(ing.fat * m * 10) / 10,
    })),
  };
}

export function AddMealSheet({ isOpen, onClose, onAddEntry, initialImage }: AddMealSheetProps) {
  const [inputMode, setInputMode] = useState<InputMode>("select");
  const [viewState, setViewState] = useState<ViewState>("input");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState("");
  const [estimation, setEstimation] = useState<FoodEstimation | null>(null);
  const [baseEstimation, setBaseEstimation] = useState<FoodEstimation | null>(null);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showIngredientDetails, setShowIngredientDetails] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState("");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handle initial image from camera FAB
  React.useEffect(() => {
    if (isOpen && initialImage) {
      setImagePreview(initialImage);
      setInputMode("camera");
      analyzeFood("image", initialImage);
    }
  }, [isOpen, initialImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fromCamera: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setInputMode(fromCamera ? "camera" : "gallery");
      analyzeFood("image", base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFood = async (type: "image" | "text", data: string) => {
    setViewState("analyzing");

    try {
      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          analysisType: type,
          imageBase64: type === "image" ? data : undefined,
          textDescription: type === "text" ? data : undefined,
        },
      });

      if (error) throw error;

      const est = result as FoodEstimation;
      setEstimation(est);
      setBaseEstimation(est);
      setMultiplier(null);
      setViewState("result");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analys misslyckades",
        description: "Kunde inte analysera måltiden. Försök igen.",
        variant: "destructive",
      });
      setViewState("input");
    }
  };

  const handleTextSubmit = () => {
    if (!textDescription.trim()) return;
    analyzeFood("text", textDescription);
  };

  const handleRecalculate = async (adjustment: string) => {
    if (!estimation || !adjustment.trim()) return;

    setIsRecalculating(true);

    try {
      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          analysisType: "adjust",
          originalEstimation: estimation,
          adjustment,
        },
      });

      if (error) throw error;

      const est = result as FoodEstimation;
      setEstimation(est);
      setBaseEstimation(est);
      setMultiplier(null);
      setAdjustmentText("");
      toast({
        title: "Uppskattning uppdaterad",
        description: "Näringsvärdena har räknats om.",
      });
    } catch (error) {
      console.error("Recalculation failed:", error);
      toast({
        title: "Omräkning misslyckades",
        description: "Kunde inte räkna om. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  // Multiplier is always applied to the ORIGINAL estimate — never cumulative.
  const handleQuickAdjust = (value: number) => {
    if (!baseEstimation) return;
    if (multiplier === value) {
      setMultiplier(null);
      setEstimation(baseEstimation);
      return;
    }
    setMultiplier(value);
    setEstimation(scaleEstimation(baseEstimation, value));
  };

  const handleConfirm = () => {
    if (!estimation) return;

    onAddEntry({
      mealName: estimation.mealName,
      mealType: estimation.mealType,
      calories: estimation.calories,
      protein: estimation.protein,
      carbs: estimation.carbs,
      fat: estimation.fat,
      isAiEstimated: true,
      imageUrl: imagePreview || undefined,
      ingredients: estimation.ingredients,
    });

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setInputMode("select");
    setViewState("input");
    setImagePreview(null);
    setTextDescription("");
    setEstimation(null);
    setBaseEstimation(null);
    setMultiplier(null);
    setShowIngredients(false);
    setShowIngredientDetails(false);
    setAdjustmentText("");
    setTypePickerOpen(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const confidence = estimation ? CONFIDENCE_STYLE[estimation.confidence] : null;

  const macros = estimation
    ? [
        { key: "calories" as const, value: estimation.calories, unit: "", label: "KCAL" },
        { key: "protein" as const, value: estimation.protein, unit: "g", label: "PROTEIN" },
        { key: "carbs" as const, value: estimation.carbs, unit: "g", label: "KOLH." },
        { key: "fat" as const, value: estimation.fat, unit: "g", label: "FETT" },
      ]
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] p-0 border-0 bg-background rounded-t-panel overflow-hidden [&>button]:hidden"
      >
        {/* ============ INPUT: SELECT MODE ============ */}
        {viewState === "input" && inputMode === "select" && (
          <div className="px-5 pt-3 pb-10">
            <div className="relative mb-6">
              <div className="mx-auto h-1.5 w-11 rounded-pill bg-foreground/25" />
              <button
                type="button"
                onClick={handleClose}
                aria-label="Stäng"
                className="absolute -top-1 right-0 h-9 w-9 rounded-pill bg-card grid place-items-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <h2 className="font-display text-[26px] uppercase leading-[0.95] text-foreground mb-5">
              Lägg till måltid
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                className="h-24 rounded-card bg-card flex flex-col items-center justify-center gap-2 text-foreground transition-transform active:scale-[0.97]"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-bold">Ta foto</span>
              </button>
              <button
                type="button"
                className="h-24 rounded-card bg-card flex flex-col items-center justify-center gap-2 text-foreground transition-transform active:scale-[0.97]"
                onClick={() => galleryInputRef.current?.click()}
              >
                <Image className="w-6 h-6" />
                <span className="text-xs font-bold">Välj bild</span>
              </button>
              <button
                type="button"
                className="h-24 rounded-card bg-card flex flex-col items-center justify-center gap-2 text-foreground transition-transform active:scale-[0.97]"
                onClick={() => setInputMode("text")}
              >
                <Type className="w-6 h-6" />
                <span className="text-xs font-bold">Skriv in</span>
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange(e, true)}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, false)}
            />
          </div>
        )}

        {/* ============ INPUT: TEXT MODE ============ */}
        {viewState === "input" && inputMode === "text" && (
          <div className="px-5 pt-3 pb-10">
            <div className="relative mb-6">
              <div className="mx-auto h-1.5 w-11 rounded-pill bg-foreground/25" />
              <button
                type="button"
                onClick={handleClose}
                aria-label="Stäng"
                className="absolute -top-1 right-0 h-9 w-9 rounded-pill bg-card grid place-items-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <h2 className="font-display text-[26px] uppercase leading-[0.95] text-foreground mb-5">
              Beskriv din måltid
            </h2>
            <Textarea
              placeholder="T.ex. 'En tallrik pasta carbonara med sallad'"
              value={textDescription}
              onChange={(e) => setTextDescription(e.target.value)}
              className="min-h-[120px] rounded-card bg-card border-0 text-foreground placeholder:text-foreground/40"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-pill border-[1.5px] border-primary py-3.5 text-[14px] font-bold text-primary transition-transform active:scale-[0.97]"
                onClick={() => setInputMode("select")}
              >
                Tillbaka
              </button>
              <button
                type="button"
                className="flex-1 rounded-pill bg-primary py-3.5 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50"
                onClick={handleTextSubmit}
                disabled={!textDescription.trim()}
              >
                Analysera
              </button>
            </div>
          </div>
        )}

        {/* ============ ANALYZING ============ */}
        {viewState === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            {imagePreview && (
              <div className="w-32 h-32 rounded-card overflow-hidden">
                <img src={imagePreview} alt="Mat" className="w-full h-full object-cover" />
              </div>
            )}
            <OrganicLoader size={32} label="Analyserar måltiden" />
            <p className="text-sm text-foreground/60">Analyserar måltiden...</p>
          </div>
        )}

        {/* ============ RESULT ============ */}
        {viewState === "result" && estimation && (
          <div className="max-h-[92dvh] overflow-y-auto overscroll-contain pb-8">
            {/* 1. Hero */}
            <div className={cn("relative h-[190px] w-full overflow-hidden rounded-t-panel", !imagePreview && "bg-gold")}>
              {imagePreview ? (
                <img src={imagePreview} alt="Mat" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <Camera className="w-10 h-10 text-foreground/40" />
                </div>
              )}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-1.5 w-11 rounded-pill bg-foreground/25" />
              <button
                type="button"
                onClick={handleClose}
                aria-label="Stäng"
                className="absolute top-3 right-3 h-9 w-9 rounded-pill bg-card/90 grid place-items-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>

              {/* Meal type pill — click to change */}
              <Popover open={typePickerOpen} onOpenChange={setTypePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-pill bg-card/95 px-3.5 py-2 text-[12px] font-bold text-foreground"
                  >
                    {estimation.mealType}
                    <ChevronDown className="w-3.5 h-3.5 text-foreground/60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 rounded-card bg-card border-0 p-2 shadow-elevated">
                  <div className="flex flex-col gap-1">
                    {MEAL_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setEstimation({ ...estimation, mealType: t });
                          setBaseEstimation(baseEstimation ? { ...baseEstimation, mealType: t } : null);
                          setTypePickerOpen(false);
                        }}
                        className={cn(
                          "rounded-pill px-3.5 py-2 text-left text-[13px] font-bold transition-colors",
                          estimation.mealType === t
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-foreground"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* 2. Title block */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/55">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI-uppskattning
                </p>
                {confidence && (
                  <span
                    className={cn(
                      "rounded-pill px-2.5 py-1 text-[11px] font-bold text-foreground",
                      confidence.cls
                    )}
                  >
                    {confidence.label}
                  </span>
                )}
              </div>
              <Textarea
                value={estimation.mealName}
                onChange={(e) => {
                  setEstimation({ ...estimation, mealName: e.target.value });
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRecalculating) {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).blur();
                    handleRecalculate(
                      `Rätten är faktiskt: ${estimation.mealName}. Räkna om näringsvärden utifrån detta.`
                    );
                  }
                }}
                rows={1}
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
                className="mt-2 font-display text-[26px] uppercase leading-[0.95] text-foreground border-0 bg-transparent rounded-none px-0 py-0 shadow-none focus-visible:ring-0 focus-visible:outline-none transition-colors resize-none overflow-hidden min-h-0 w-full break-words"
                style={{ textWrap: "balance" } as React.CSSProperties}
                placeholder="Måltidens namn"
              />
            </div>

            {/* 3. Nutrition card */}
            <div className="px-5">
              <div className="rounded-card bg-card px-4 py-4">
                <div className="grid grid-cols-4 gap-2">
                  {macros.map((m) => (
                    <div key={m.key} className="flex flex-col items-center text-center min-w-0">
                      <span className={cn("h-[9px] w-[9px] rounded-pill mb-1.5", MACRO_DOT[m.key])} />
                      <p className="font-display text-[24px] leading-none text-foreground">
                        {m.value}
                        {m.unit && <span className="text-[13px] ml-0.5">{m.unit}</span>}
                      </p>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-foreground/55">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Ingredients toggle */}
                {estimation.ingredients && estimation.ingredients.length > 0 && (
                  <button
                    type="button"
                    className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-foreground transition-colors"
                    onClick={() => setShowIngredients((v) => !v)}
                  >
                    <span className="h-5 w-5 rounded-pill border-[1.5px] border-primary grid place-items-center text-[11px] font-bold text-primary">
                      i
                    </span>
                    {showIngredients
                      ? `Dölj ingredienser (${estimation.ingredients.length})`
                      : `Visa ingredienser (${estimation.ingredients.length})`}
                  </button>
                )}
              </div>
            </div>

            {/* 4. Ingredient card */}
            {showIngredients && estimation.ingredients && estimation.ingredients.length > 0 && (
              <div className="px-5 mt-3 animate-fade-in">
                <div className="rounded-card bg-card px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/70">
                      Det här bedömde AI:n ({estimation.ingredients.length})
                    </p>
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-foreground underline underline-offset-2"
                      onClick={() => setShowIngredientDetails((v) => !v)}
                    >
                      {showIngredientDetails ? "Dölj detaljer" : "Visa detaljer"}
                    </button>
                  </div>

                  <ul className="space-y-2.5">
                    {estimation.ingredients.map((ing, i) => (
                      <li key={`${ing.name}-${i}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold text-foreground truncate">{ing.name}</p>
                            {ing.amount && (
                              <p className="text-[12px] text-foreground/55">{ing.amount}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-[13px] font-bold text-foreground/80">
                            {ing.calories} kcal
                          </span>
                        </div>
                        {showIngredientDetails && (
                          <div className="mt-1.5 grid grid-cols-3 gap-1.5 animate-fade-in">
                            <span className="inline-flex items-center justify-center gap-1.5 rounded-pill bg-background px-2 py-1 text-[11px] font-semibold text-foreground">
                              <span className="h-1.5 w-1.5 rounded-pill bg-leaf" />P {ing.protein} g
                            </span>
                            <span className="inline-flex items-center justify-center gap-1.5 rounded-pill bg-background px-2 py-1 text-[11px] font-semibold text-foreground">
                              <span className="h-1.5 w-1.5 rounded-pill bg-gold" />K {ing.carbs} g
                            </span>
                            <span className="inline-flex items-center justify-center gap-1.5 rounded-pill bg-background px-2 py-1 text-[11px] font-semibold text-foreground">
                              <span className="h-1.5 w-1.5 rounded-pill bg-apricot" />F {ing.fat} g
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 5. Adjust amount */}
            <div className="px-5 mt-3">
              <div className="rounded-card bg-card px-4 py-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/70">
                  Justera mängd
                </p>
                <div className="flex gap-2">
                  {QUICK_MULTIPLIERS.map((q) => (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => handleQuickAdjust(q.value)}
                      className={cn(
                        "flex-1 rounded-pill border-[1.5px] border-primary py-2 text-[12px] font-bold transition-colors",
                        multiplier === q.value
                          ? "bg-primary text-primary-foreground"
                          : "text-primary"
                      )}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder='Beskriv en ändring, t.ex. "tog bara en tugga"'
                    value={adjustmentText}
                    onChange={(e) => setAdjustmentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && adjustmentText.trim() && !isRecalculating) {
                        e.preventDefault();
                        handleRecalculate(adjustmentText);
                      }
                    }}
                    className="w-full rounded-pill bg-background px-4 py-3.5 text-[14px] text-foreground placeholder:text-foreground/40 border-0 outline-none focus:ring-[3px] focus:ring-primary/30"
                  />
                  {isRecalculating && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-foreground/50" />
                  )}
                </div>
              </div>
            </div>

            {/* 6. Action buttons */}
            <div className="px-5 mt-4 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-pill border-[1.5px] border-primary py-3.5 text-[14px] font-bold text-primary transition-transform active:scale-[0.97]"
                onClick={handleReset}
              >
                Börja om
              </button>
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-pill bg-primary py-3.5 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.97]"
                onClick={handleConfirm}
              >
                <Check className="w-4 h-4" />
                Lägg till
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
