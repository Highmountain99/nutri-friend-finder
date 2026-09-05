import React, { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, Loader2, RefreshCw, Trash2, X, Pencil, Check, CalendarIcon, Clock } from "lucide-react";
import { OrganicLoader } from "@/components/ui/OrganicLoader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useMealImage } from "@/lib/mealImages";
import { toast } from "@/hooks/use-toast";
import { format, isToday } from "date-fns";
import { sv } from "date-fns/locale";
import type { NutritionEntry, Ingredient } from "@/hooks/useJournalData";

interface EditMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  entry: NutritionEntry | null;
  onUpdate: (id: string, updates: Partial<NutritionEntry> & { mealTime?: Date }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

const MEAL_TYPES = ["Frukost", "Förmiddagssnack", "Lunch", "Mellanmål", "Middag", "Kvällssnack"];

const MACRO_DOT = {
  calories: "bg-terracotta",
  protein: "bg-leaf",
  carbs: "bg-gold",
  fat: "bg-apricot",
} as const;

const HERO_TONES = ["bg-gold", "bg-sage", "bg-apricot"];

export function EditMealSheet({ isOpen, onClose, entry, onUpdate, onDelete }: EditMealSheetProps) {
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("");
  const [mealTime, setMealTime] = useState<Date>(new Date());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("medium");
  const [dataSource, setDataSource] = useState<"livsmedelsverket" | "ai_estimation" | "mixed">("ai_estimation");

  const [baseNutrition, setBaseNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [baseIngredients, setBaseIngredients] = useState<Ingredient[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState("");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const displayImage = useMealImage(imagePreview);

  useEffect(() => {
    if (entry && isOpen) {
      setMealName(entry.mealName);
      setMealType(entry.mealType);
      setMealTime(new Date(entry.createdAt));
      setImagePreview(entry.imageUrl || null);
      setCalories(entry.calories);
      setProtein(entry.protein);
      setCarbs(entry.carbs);
      setFat(entry.fat);
      setIngredients(entry.ingredients || []);
      setBaseNutrition({ calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat });
      setBaseIngredients(entry.ingredients || []);
      setConfidence("medium");
      setDataSource(entry.isAiEstimated ? "ai_estimation" : "livsmedelsverket");
      setMultiplier(null);
      setIsEditing(false);
      setShowDetails(false);
      setAdjustmentText("");
    }
  }, [entry, isOpen]);

  // Lazy-load image_url (list queries skip it)
  useEffect(() => {
    if (!entry?.id || !isOpen || entry.imageUrl) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("nutrition_entries")
        .select("image_url")
        .eq("id", entry.id)
        .maybeSingle();
      if (!cancelled && data?.image_url) setImagePreview(data.image_url);
    })();
    return () => { cancelled = true; };
  }, [entry?.id, entry?.imageUrl, isOpen]);

  const applyEstimation = (estimation: FoodEstimation, withName = false) => {
    if (withName) setMealName(estimation.mealName);
    setMealType(estimation.mealType || mealType);
    setCalories(Math.round(estimation.calories));
    setProtein(estimation.protein);
    setCarbs(estimation.carbs);
    setFat(estimation.fat);
    setIngredients(estimation.ingredients || []);
    setBaseNutrition({
      calories: Math.round(estimation.calories),
      protein: estimation.protein,
      carbs: estimation.carbs,
      fat: estimation.fat,
    });
    setBaseIngredients(estimation.ingredients || []);
    setConfidence(estimation.confidence);
    setDataSource(estimation.dataSource || "ai_estimation");
    setMultiplier(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsAnalyzing(true);
      try {
        const { data: result, error } = await supabase.functions.invoke("analyze-food", {
          body: { analysisType: "image", imageBase64: base64 },
        });
        if (error) throw error;
        applyEstimation(result as FoodEstimation, true);
        toast({ title: "Ny bild analyserad", description: "Näringsvärdena har uppdaterats." });
      } catch {
        toast({ title: "Analys misslyckades", description: "Näringsvärdena behålls.", variant: "destructive" });
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRecalculate = async () => {
    if (!adjustmentText.trim()) return;
    setIsRecalculating(true);
    try {
      const originalEstimation: FoodEstimation = {
        mealName, mealType, calories, protein, carbs, fat, ingredients, confidence, dataSource,
      };
      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: { analysisType: "adjust", originalEstimation, adjustment: adjustmentText },
      });
      if (error) throw error;
      applyEstimation(result as FoodEstimation);
      setAdjustmentText("");
      toast({ title: "Uppskattning uppdaterad", description: "Näringsvärdena har räknats om." });
    } catch {
      toast({ title: "Omräkning misslyckades", description: "Försök igen.", variant: "destructive" });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleQuickAdjust = (m: number) => {
    const next = multiplier === m ? null : m;
    setMultiplier(next);
    const f = next ?? 1;
    setCalories(Math.round(baseNutrition.calories * f));
    setProtein(Math.round(baseNutrition.protein * f * 10) / 10);
    setCarbs(Math.round(baseNutrition.carbs * f * 10) / 10);
    setFat(Math.round(baseNutrition.fat * f * 10) / 10);
    setIngredients(baseIngredients.map((ing) => ({
      ...ing,
      calories: Math.round(ing.calories * f),
      protein: Math.round(ing.protein * f * 10) / 10,
      carbs: Math.round(ing.carbs * f * 10) / 10,
      fat: Math.round(ing.fat * f * 10) / 10,
    })));
  };

  const handleSave = async () => {
    if (!entry) return;
    setIsSaving(true);
    try {
      await onUpdate(entry.id, {
        mealName, mealType, calories, protein, carbs, fat,
        imageUrl: imagePreview || undefined,
        ingredients,
        mealTime,
      });
      setBaseNutrition({ calories, protein, carbs, fat });
      setBaseIngredients(ingredients);
      setMultiplier(null);
      setIsEditing(false);
      toast({ title: "Måltid uppdaterad", description: "Dina ändringar har sparats." });
    } catch {
      toast({ title: "Kunde inte spara", description: "Något gick fel. Försök igen.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await onDelete(entry.id);
      toast({ title: "Måltid borttagen", description: "Måltiden har tagits bort." });
      onClose();
    } catch {
      toast({ title: "Kunde inte ta bort", description: "Något gick fel. Försök igen.", variant: "destructive" });
    }
  };

  if (!entry) return null;

  const heroTone = HERO_TONES[new Date(entry.createdAt).getHours() % HERO_TONES.length];
  const dayLabel = isToday(mealTime) ? "IDAG" : format(mealTime, "d MMM", { locale: sv }).toUpperCase();
  const eyebrow = `${(mealType || "MÅLTID").toUpperCase()} · ${dayLabel} ${format(mealTime, "HH:mm")}`;

  const macros = [
    { key: "calories" as const, value: Math.round(calories), unit: "", label: "KCAL" },
    { key: "protein" as const, value: Math.round(protein), unit: "g", label: "PROTEIN" },
    { key: "carbs" as const, value: Math.round(carbs), unit: "g", label: "KOLH." },
    { key: "fat" as const, value: Math.round(fat), unit: "g", label: "FETT" },
  ];

  const setTimePart = (hours: number, minutes: number) => {
    const d = new Date(mealTime);
    d.setHours(hours, minutes);
    setMealTime(d);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] p-0 border-0 bg-background rounded-t-panel overflow-hidden [&>button]:hidden"
      >
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <OrganicLoader size={32} label="Analyserar måltiden" />
            <p className="text-sm text-foreground/60">Analyserar...</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto overscroll-contain pb-10">
            {/* Hero */}
            <div className={cn("relative h-[180px] w-full overflow-hidden rounded-t-panel", !displayImage && heroTone)}>
              {displayImage ? (
                <img src={displayImage} alt={mealName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <Camera className="w-10 h-10 text-foreground/40" />
                </div>
              )}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-1.5 w-11 rounded-pill bg-foreground/25" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Stäng"
                className="absolute top-3 right-3 h-9 w-9 rounded-pill bg-card/90 grid place-items-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>

              {isEditing && (
                <div className="absolute bottom-3 right-3 flex gap-2 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="whitespace-nowrap rounded-pill bg-card/90 px-3.5 py-2 text-[12px] font-bold text-foreground"
                  >
                    Ny bild
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="whitespace-nowrap rounded-pill bg-card/90 px-3.5 py-2 text-[12px] font-bold text-foreground"
                  >
                    Galleri
                  </button>
                </div>
              )}
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {/* Title block */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/55 whitespace-nowrap">
                {eyebrow}
              </p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <h2
                  className="font-display text-[26px] uppercase leading-[0.95] text-foreground flex-1"
                  style={{ textWrap: "balance" } as React.CSSProperties}
                >
                  {mealName}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-[12px] font-bold transition-colors",
                    isEditing
                      ? "bg-primary text-primary-foreground"
                      : "border-[1.5px] border-primary text-primary"
                  )}
                >
                  {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  {isEditing ? "Klar" : "Redigera"}
                </button>
              </div>
            </div>

            {/* Summary card */}
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
              </div>
            </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div className="px-5 mt-3">
                <div className="rounded-card bg-card px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/70 mb-3">
                    Ingredienser ({ingredients.length})
                  </p>

                  <ul className="space-y-2">
                    {ingredients.map((ing, i) => (
                      <li
                        key={`${ing.name}-${i}`}
                        className="flex items-center justify-between gap-3 text-[14px]"
                      >
                        <span className="font-medium text-foreground truncate">
                          {ing.name}
                          {ing.amount && (
                            <span className="text-foreground/55 font-normal ml-1.5">{ing.amount}</span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold text-foreground/70">
                          {ing.calories} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Edit mode card */}
            {isEditing && (
              <div className="px-5 mt-3 animate-fade-in">
                <div className="rounded-card bg-card px-4 py-4 space-y-4">
                  {/* Meal type */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/70 mb-2">Måltidstyp</p>
                    <div className="flex flex-wrap gap-2">
                      {MEAL_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setMealType(t)}
                          className={cn(
                            "rounded-pill px-3.5 py-2 text-[12px] font-bold transition-colors",
                            mealType === t ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & time */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/70 mb-2">Tid & datum</p>
                    <div className="flex gap-2">
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex-1 flex items-center gap-2 rounded-[14px] bg-background px-3.5 py-3 text-[14px] font-semibold text-foreground"
                          >
                            <CalendarIcon className="w-4 h-4 text-foreground/60" />
                            {isToday(mealTime) ? "Idag" : format(mealTime, "d MMM", { locale: sv })}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={mealTime}
                            onSelect={(d) => {
                              if (!d) return;
                              const nd = new Date(d);
                              nd.setHours(mealTime.getHours(), mealTime.getMinutes());
                              setMealTime(nd);
                              setCalendarOpen(false);
                            }}
                            locale={sv}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-[14px] bg-background px-3.5 py-3 text-[14px] font-semibold text-foreground"
                          >
                            <Clock className="w-4 h-4 text-foreground/60" />
                            {format(mealTime, "HH:mm")}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3 bg-card z-50" align="end">
                          <input
                            type="time"
                            value={format(mealTime, "HH:mm")}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(":").map(Number);
                              if (!Number.isNaN(h) && !Number.isNaN(m)) setTimePart(h, m);
                            }}
                            className="rounded-[12px] bg-background px-3 py-2 text-[15px] font-semibold text-foreground"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/70 mb-2">Justera mängd</p>
                    <div className="flex gap-2">
                      {[
                        { label: "Hälften", value: 0.5 },
                        { label: "3/4", value: 0.75 },
                        { label: "1.5x", value: 1.5 },
                      ].map((q) => (
                        <button
                          key={q.value}
                          type="button"
                          onClick={() => handleQuickAdjust(q.value)}
                          className={cn(
                            "flex-1 rounded-pill px-3 py-2.5 text-[13px] font-bold transition-colors",
                            multiplier === q.value
                              ? "bg-primary text-primary-foreground"
                              : "border-[1.5px] border-primary text-primary"
                          )}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-foreground/55">
                      Kalorier och näringsvärden räknas om direkt.
                    </p>
                  </div>

                  {/* Free text adjust */}
                  <div className="flex items-center gap-2">
                    <input
                      value={adjustmentText}
                      onChange={(e) => setAdjustmentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && adjustmentText.trim() && !isRecalculating) {
                          e.preventDefault();
                          handleRecalculate();
                        }
                      }}
                      placeholder='Beskriv en ändring, t.ex. "utan dressing"...'
                      className="flex-1 min-w-0 rounded-pill bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground/45 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRecalculate}
                      disabled={!adjustmentText.trim() || isRecalculating}
                      aria-label="Räkna om"
                      className="h-11 w-11 shrink-0 grid place-items-center rounded-pill bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {isRecalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-[13px] font-bold text-terracotta"
                      >
                        <Trash2 className="w-4 h-4" />
                        Ta bort måltiden
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ta bort måltid?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Är du säker på att du vill ta bort "{mealName}"? Detta går inte att ångra.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Ta bort
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-3 w-full rounded-pill bg-primary py-4 text-[15px] font-bold text-primary-foreground disabled:opacity-60"
                >
                  {isSaving ? "Sparar..." : "Spara ändringar"}
                </button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
