import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, X, Scale, Ruler, Heart, Activity, Target, Stethoscope } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const activityLabels: Record<string, string> = {
  sedentary: "Stillasittande",
  lightly_active: "Lätt aktiv",
  moderately_active: "Måttligt aktiv",
  active: "Aktiv",
  very_active: "Mycket aktiv",
};

interface PatientHealthProfileCardProps {
  patientId: string;
  intakeData?: {
    activity_level?: string | null;
    unified_concern_category?: string | null;
    primary_concern_subcategory?: string | null;
    concern_tags?: string[] | null;
    preference_tags?: string[] | null;
    ai_free_text?: string | null;
  } | null;
  healthTrackingData?: Array<{
    metric_type: string;
    value: number;
    unit?: string | null;
    entry_date: string;
  }>;
  nutritionSettings?: {
    weight_kg?: number | null;
    height_cm?: number | null;
  } | null;
}

export function PatientHealthProfileCard({
  patientId,
  intakeData,
  healthTrackingData = [],
  nutritionSettings,
}: PatientHealthProfileCardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editConditions, setEditConditions] = useState(false);
  const [editGoals, setEditGoals] = useState(false);
  const [newCondition, setNewCondition] = useState("");
  const [newGoal, setNewGoal] = useState("");

  // Fetch dietitian-set conditions & goals from patient_progress_config
  const { data: config } = useQuery({
    queryKey: ["patient-health-config", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_progress_config")
        .select("id, patient_conditions, patient_goals, dietitian_id")
        .eq("patient_id", patientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (fields: { patient_conditions?: string[]; patient_goals?: string[] }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (config?.id) {
        const { error } = await supabase
          .from("patient_progress_config")
          .update(fields)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("patient_progress_config")
          .insert({
            patient_id: patientId,
            dietitian_id: user.id,
            ...fields,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-health-config", patientId] });
    },
  });

  const conditions: string[] = (config as any)?.patient_conditions ?? [];
  const goals: string[] = (config as any)?.patient_goals ?? [];

  // Health metrics from tracking entries
  const latestMetric = (type: string) => {
    const entries = healthTrackingData.filter((h) => h.metric_type === type);
    return entries.length > 0 ? entries[0] : null;
  };

  const weight = nutritionSettings?.weight_kg ?? latestMetric("weight")?.value;
  const height = nutritionSettings?.height_cm ?? latestMetric("height")?.value;
  const systolic = latestMetric("blood_pressure_systolic");
  const diastolic = latestMetric("blood_pressure_diastolic");
  const bloodPressure = systolic && diastolic ? `${systolic.value}/${diastolic.value}` : null;
  const waist = latestMetric("waist_circumference");
  const activityLevel = intakeData?.activity_level;

  const addCondition = () => {
    if (!newCondition.trim()) return;
    const updated = [...conditions, newCondition.trim()];
    upsertConfig.mutate({ patient_conditions: updated });
    setNewCondition("");
    toast.success("Diagnos tillagd");
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    upsertConfig.mutate({ patient_conditions: updated });
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const updated = [...goals, newGoal.trim()];
    upsertConfig.mutate({ patient_goals: updated });
    setNewGoal("");
    toast.success("Mål tillagt");
  };

  const removeGoal = (index: number) => {
    const updated = goals.filter((_, i) => i !== index);
    upsertConfig.mutate({ patient_goals: updated });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hälsoprofil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Health metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricItem icon={Scale} label="Vikt" value={weight ? `${weight} kg` : null} />
            <MetricItem icon={Ruler} label="Längd" value={height ? `${height} cm` : null} />
            <MetricItem icon={Heart} label="Blodtryck" value={bloodPressure ? `${bloodPressure} mmHg` : null} />
            <MetricItem icon={Target} label="Midjemått" value={waist ? `${waist.value} ${waist.unit ?? "cm"}` : null} />
            <MetricItem icon={Activity} label="Aktivitetsnivå" value={activityLevel ? activityLabels[activityLevel] ?? activityLevel : null} />
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Diagnoser & tillstånd</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditConditions(true)}>
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
            {conditions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Inga diagnoser registrerade</p>
            )}
          </div>

          {/* Goals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mål</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditGoals(true)}>
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
            {goals.length > 0 ? (
              <div className="space-y-1">
                {goals.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm">{g}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Inga mål registrerade</p>
            )}
          </div>

          {/* Registration free text */}
          {intakeData?.ai_free_text && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Från registrering</p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{intakeData.ai_free_text}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Conditions Sheet */}
      <Sheet open={editConditions} onOpenChange={setEditConditions}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Diagnoser & tillstånd</SheetTitle>
            <SheetDescription>Lägg till eller ta bort diagnoser och utredningar</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="T.ex. Potentiell IBS - under utredning"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCondition()}
              />
              <Button size="icon" onClick={addCondition} disabled={!newCondition.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-sm">{c}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCondition(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {conditions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Inga diagnoser tillagda ännu</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Goals Sheet */}
      <Sheet open={editGoals} onOpenChange={setEditGoals}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Klientens mål</SheetTitle>
            <SheetDescription>Sätt mål för klienten baserat på journal och bedömning</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="T.ex. Minska magbesvär efter måltid"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
              />
              <Button size="icon" onClick={addGoal} disabled={!newGoal.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {goals.map((g, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-sm">{g}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeGoal(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {goals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Inga mål tillagda ännu</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MetricItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
        <p className="text-sm font-medium truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}
