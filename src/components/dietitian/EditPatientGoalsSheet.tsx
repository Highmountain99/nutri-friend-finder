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
    calories: currentGoals?.calories_goal ?? 2000,
    protein: currentGoals?.protein_goal ?? 50,
    carbs: currentGoals?.carbs_goal ?? 250,
    fat: currentGoals?.fat_goal ?? 65,
  });

  useEffect(() => {
    if (open && currentGoals) {
      setForm({
        calories: currentGoals.calories_goal ?? 2000,
        protein: currentGoals.protein_goal ?? 50,
        carbs: currentGoals.carbs_goal ?? 250,
        fat: currentGoals.fat_goal ?? 65,
      });
    }
  }, [open, currentGoals]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Check if goals exist
      const { data: existing } = await supabase
        .from("user_nutrition_goals")
        .select("id")
        .eq("user_id", patientId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_nutrition_goals")
          .update({
            calories_goal: form.calories,
            protein_goal: form.protein,
            carbs_goal: form.carbs,
            fat_goal: form.fat,
            set_by_dietist: true,
            dietist_id: user.id,
          })
          .eq("user_id", patientId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_nutrition_goals")
          .insert({
            user_id: patientId,
            calories_goal: form.calories,
            protein_goal: form.protein,
            carbs_goal: form.carbs,
            fat_goal: form.fat,
            set_by_dietist: true,
            dietist_id: user.id,
          });
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px]">
        <SheetHeader>
          <SheetTitle>Justera näringsmål</SheetTitle>
          <SheetDescription>Sätt dagliga mål för patienten. Patienten ser dessa som sina kvoter.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Kalorier (kcal)</Label>
            <Input type="number" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Protein (g)</Label>
            <Input type="number" value={form.protein} onChange={(e) => setForm((f) => ({ ...f, protein: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Kolhydrater (g)</Label>
            <Input type="number" value={form.carbs} onChange={(e) => setForm((f) => ({ ...f, carbs: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Fett (g)</Label>
            <Input type="number" value={form.fat} onChange={(e) => setForm((f) => ({ ...f, fat: Number(e.target.value) }))} />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Sparar..." : "Spara mål"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
