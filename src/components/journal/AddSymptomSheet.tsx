import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Check, Clock, Unlink, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { NutritionEntry } from "@/hooks/useJournalData";

interface AddSymptomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSymptom: (symptom: {
    mealId: string | null;
    description: string;
    symptomTime: Date;
  }) => void;
  meals: NutritionEntry[];
}

const QUICK_TIMES = [
  { label: "Nu", minutes: 0 },
  { label: "15 min sedan", minutes: 15 },
  { label: "30 min sedan", minutes: 30 },
  { label: "1 h sedan", minutes: 60 },
];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Frukost",
  lunch: "Lunch",
  dinner: "Middag",
  snack: "Mellanmål",
};

function MealRow({
  active,
  onClick,
  tile,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  tile: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-[16px] p-2.5 text-left transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
      )}
    >
      <span
        className={cn(
          "h-10 w-10 shrink-0 rounded-[13px] grid place-items-center",
          active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-accent/60 text-foreground"
        )}
      >
        {tile}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold leading-tight">{title}</span>
        {subtitle && (
          <span
            className={cn(
              "block text-[13px] leading-tight",
              active ? "text-primary-foreground/70" : "text-foreground/55"
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
      <span
        className={cn(
          "h-6 w-6 shrink-0 rounded-full grid place-items-center border-2",
          active
            ? "border-primary-foreground bg-primary-foreground text-primary"
            : "border-foreground/25 text-transparent"
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-pill px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-background text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function AddSymptomSheet({
  isOpen,
  onClose,
  onAddSymptom,
  meals,
}: AddSymptomSheetProps) {
  const { toast } = useToast();
  const [selectedMealId, setSelectedMealId] = useState<string>("none");
  const [symptomTime, setSymptomTime] = useState(() => format(new Date(), "HH:mm"));
  const [quickChoice, setQuickChoice] = useState<number | null>(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedMealId("none");
      setSymptomTime(format(new Date(), "HH:mm"));
      setQuickChoice(0);
      setDescription("");
    }
  }, [isOpen]);

  const applyQuickTime = (minutes: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - minutes);
    setSymptomTime(format(d, "HH:mm"));
    setQuickChoice(minutes);
  };

  const selectMeal = (meal: NutritionEntry | null) => {
    if (!meal) {
      setSelectedMealId("none");
      return;
    }
    setSelectedMealId(meal.id);
    const d = new Date(meal.createdAt);
    d.setMinutes(d.getMinutes() + 30);
    setSymptomTime(format(d, "HH:mm"));
    setQuickChoice(null);
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({
        title: "Beskrivning saknas",
        description: "Ange en beskrivning av ditt symptom",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = symptomTime.split(":").map(Number);
    const symptomDate = new Date();
    symptomDate.setHours(hours, minutes, 0, 0);

    onAddSymptom({
      mealId: selectedMealId === "none" ? null : selectedMealId,
      description: description.trim(),
      symptomTime: symptomDate,
    });

    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] rounded-t-[28px] border-0 bg-background p-0 overflow-y-auto [&>button]:hidden"
      >
        {/* Drag handle */}
        <div className="pt-3 flex justify-center">
          <span className="h-1 w-10 rounded-pill bg-foreground/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-[26px] uppercase leading-[1.05] text-foreground">
            Lägg till{" "}
            <span className="pill-highlight pill-highlight--apricot px-2.5">
              symptom
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="shrink-0 h-9 w-9 rounded-pill bg-card grid place-items-center text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-3 space-y-3.5">
          {/* 1. Koppla till måltid */}
          <div className="rounded-card bg-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-foreground/55 mb-3">
              Koppla till måltid
            </p>
            <div className="space-y-2">
              <MealRow
                active={selectedMealId === "none"}
                onClick={() => selectMeal(null)}
                tile={<Unlink className="h-5 w-5" />}
                title="Inte kopplat till någon måltid"
              />
              {meals.map((meal) => (
                <MealRow
                  key={meal.id}
                  active={selectedMealId === meal.id}
                  onClick={() => selectMeal(meal)}
                  tile={
                    <span className="text-[13px] font-bold tabular-nums">
                      {format(meal.createdAt, "HH:mm")}
                    </span>
                  }
                  title={meal.mealName}
                  subtitle={MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType}
                />
              ))}
            </div>
          </div>


          {/* 2. Tid för symptom */}
          <div className="rounded-card bg-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-foreground/55 mb-3">
              Tid för symptom
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TIMES.map((q) => (
                <Pill
                  key={q.label}
                  active={quickChoice === q.minutes}
                  onClick={() => applyQuickTime(q.minutes)}
                >
                  {q.label}
                </Pill>
              ))}
            </div>

            <label className="mt-3.5 flex items-center gap-2.5 rounded-[14px] bg-background px-3.5 py-3 w-fit">
              <Clock className="h-4 w-4 text-foreground/70" />
              <span className="text-[14px] font-semibold text-foreground">Idag</span>
              <input
                type="time"
                value={symptomTime}
                onChange={(e) => {
                  setSymptomTime(e.target.value);
                  setQuickChoice(null);
                }}
                className="bg-transparent border-0 p-0 text-[14px] font-semibold text-foreground outline-none"
              />
            </label>
          </div>

          {/* 3. Beskriv ditt symptom */}
          <div className="rounded-card bg-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-foreground/55 mb-3">
              Beskriv ditt symptom
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="T.ex. fick ont i magen 30 minuter efter lunch..."
              rows={4}
              className="w-full resize-none rounded-[14px] bg-background px-4 py-3.5 text-[14px] text-foreground placeholder:text-foreground/40 outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pt-4 pb-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-pill border-[1.5px] border-primary py-3 text-[14px] font-bold text-foreground"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="flex-1 rounded-pill bg-primary py-3 text-[14px] font-bold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Lägg till
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
