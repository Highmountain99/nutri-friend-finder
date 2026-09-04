import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EditPatientGoalsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  currentGoals: {
    calories_goal: number | null;
    protein_goal: number | null;
    carbs_goal: number | null;
    fat_goal: number | null;
  } | null;
}

export function EditPatientGoalsSheet({ open, onOpenChange, patientId, currentGoals }: EditPatientGoalsSheetProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  useEffect(() => {
    if (open) {
      // Leave inputs empty so the keyboard does not cover a pre-filled value.
      setForm({ calories: "", protein: "", carbs: "", fat: "" });
    }
  }, [open]);

  const parseGoal = (value: string, fallback: number | null | undefined): number => {
    const trimmed = value.trim();
    if (trimmed === "") return fallback ?? 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback ?? 0;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        calories_goal: parseGoal(form.calories, currentGoals?.calories_goal),
        protein_goal: parseGoal(form.protein, currentGoals?.protein_goal),
        carbs_goal: parseGoal(form.carbs, currentGoals?.carbs_goal),
        fat_goal: parseGoal(form.fat, currentGoals?.fat_goal),
        set_by_dietist: true,
        dietist_id: user.id,
      };

      const { data: existing } = await supabase
        .from("user_nutrition_goals")
        .select("id")
        .eq("user_id", patientId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_nutrition_goals")
          .update(payload)
          .eq("user_id", patientId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_nutrition_goals")
          .insert({ user_id: patientId, ...payload });
        if (error) throw error;
      }

      qc.invalidateQueries({ queryKey: ["patient-goals", patientId] });
      toast.success("Näringsmål uppdaterade");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Kunde inte spara mål");
    } finally {
      setSaving(false);
    }
  };

  const currentText = (value: number | null | undefined) =>
    value != null ? value.toString() : "—";

  const scrollOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  };

  const isValid =
    form.calories.trim() !== "" ||
    form.protein.trim() !== "" ||
    form.carbs.trim() !== "" ||
    form.fat.trim() !== "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        side="bottom"
        className="rounded-t-2xl max-h-[85dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Justera näringsmål</SheetTitle>
          <SheetDescription>Sätt dagliga mål för klienten. Klienten ser dessa som sina kvoter.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-calories">Kalorier (kcal)</Label>
              <span className="text-xs text-muted-foreground">Nu: {currentText(currentGoals?.calories_goal)}</span>
            </div>
            <Input
              id="goal-calories"
              type="number"
              inputMode="numeric"
              placeholder="t.ex. 2000"
              value={form.calories}
              onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
              autoFocus={false}
              onFocus={scrollOnFocus}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-protein">Protein (g)</Label>
              <span className="text-xs text-muted-foreground">Nu: {currentText(currentGoals?.protein_goal)}</span>
            </div>
            <Input
              id="goal-protein"
              type="number"
              inputMode="numeric"
              placeholder="t.ex. 120"
              value={form.protein}
              onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
              autoFocus={false}
              onFocus={scrollOnFocus}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-carbs">Kolhydrater (g)</Label>
              <span className="text-xs text-muted-foreground">Nu: {currentText(currentGoals?.carbs_goal)}</span>
            </div>
            <Input
              id="goal-carbs"
              type="number"
              inputMode="numeric"
              placeholder="t.ex. 200"
              value={form.carbs}
              onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
              autoFocus={false}
              onFocus={scrollOnFocus}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-fat">Fett (g)</Label>
              <span className="text-xs text-muted-foreground">Nu: {currentText(currentGoals?.fat_goal)}</span>
            </div>
            <Input
              id="goal-fat"
              type="number"
              inputMode="numeric"
              placeholder="t.ex. 70"
              value={form.fat}
              onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
              autoFocus={false}
              onFocus={scrollOnFocus}
            />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving || !isValid}>
            {saving ? "Sparar..." : "Spara mål"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
