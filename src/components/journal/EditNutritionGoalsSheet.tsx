import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { NutritionGoals } from "@/hooks/useJournalData";

interface EditNutritionGoalsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: NutritionGoals;
  onSave: (goals: Partial<NutritionGoals>) => Promise<void>;
}

export function EditNutritionGoalsSheet({ open, onOpenChange, goals, onSave }: EditNutritionGoalsSheetProps) {
  const [form, setForm] = useState({
    caloriesGoal: goals.caloriesGoal,
    proteinGoal: goals.proteinGoal,
    carbsGoal: goals.carbsGoal,
    fatGoal: goals.fatGoal,
  });
  const [showWarning, setShowWarning] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        caloriesGoal: goals.caloriesGoal,
        proteinGoal: goals.proteinGoal,
        carbsGoal: goals.carbsGoal,
        fatGoal: goals.fatGoal,
      });
    }
  }, [open, goals]);

  const handleSave = async () => {
    // If goals were set by dietist, show warning first
    if (goals.setByDietist) {
      setShowWarning(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setShowWarning(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Justera näringsmål</SheetTitle>
            <SheetDescription>
              {goals.setByDietist
                ? "Dessa mål har satts av din dietist."
                : "Sätt dina dagliga mål för kalorier och makronutrienter."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Kalorier (kcal)</Label>
              <Input type="number" value={form.caloriesGoal} onChange={(e) => setForm((f) => ({ ...f, caloriesGoal: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Protein (g)</Label>
              <Input type="number" value={form.proteinGoal} onChange={(e) => setForm((f) => ({ ...f, proteinGoal: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Kolhydrater (g)</Label>
              <Input type="number" value={form.carbsGoal} onChange={(e) => setForm((f) => ({ ...f, carbsGoal: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Fett (g)</Label>
              <Input type="number" value={form.fatGoal} onChange={(e) => setForm((f) => ({ ...f, fatGoal: Number(e.target.value) }))} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Sparar..." : "Spara mål"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ändra dietistens mål?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ändra mål som din dietist har satt? Din dietist kommer bli notifierad att du har ändrat dina mål.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={doSave}>Ja, ändra mål</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
