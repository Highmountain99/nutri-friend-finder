import { useState } from "react";
import { useTreatmentPlan, type TreatmentGoal } from "@/hooks/dietitian/useTreatmentPlan";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ChevronDown, ChevronRight, Circle, CircleDot, CheckCircle2, Archive, Loader2, Trash2, Sparkles, Palette, Pencil, Target, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ConfigureProgressSheet } from "./ConfigureProgressSheet";

const statusIcon = (status: string) => {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "in_progress") return <CircleDot className="h-4 w-4 text-blue-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
};

const statusLabel: Record<string, string> = {
  not_started: "Ej påbörjad",
  in_progress: "Pågående",
  completed: "Avklarad",
};

interface Props {
  patientId: string;
}

export function TreatmentPlanTab({ patientId }: Props) {
  const { activePlan, archivedPlans, createPlan, updateGoalStatus, toggleMilestone, archivePlan, updatePlan, updateGoal, deleteGoal, addGoal: addGoalMut, addMilestone: addMilestoneMut, updateMilestone: updateMilestoneMut, deleteMilestone } = useTreatmentPlan(patientId);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [showConfigureProgress, setShowConfigureProgress] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    end_goal: "",
    end_goal_target_date: "",
    goals: [{ title: "", description: "", planned_start: "", planned_end: "", milestones: [""] }],
  });

  const toggleGoal = (id: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addGoal = () => setForm((f) => ({ ...f, goals: [...f.goals, { title: "", description: "", planned_start: "", planned_end: "", milestones: [""] }] }));
  const removeGoal = (i: number) => setForm((f) => ({ ...f, goals: f.goals.filter((_, j) => j !== i) }));
  const updateGoal = (i: number, field: string, value: string) => setForm((f) => ({ ...f, goals: f.goals.map((g, j) => j === i ? { ...g, [field]: value } : g) }));
  const addMilestone = (gi: number) => setForm((f) => ({ ...f, goals: f.goals.map((g, j) => j === gi ? { ...g, milestones: [...g.milestones, ""] } : g) }));
  const updateMilestone = (gi: number, mi: number, value: string) => setForm((f) => ({ ...f, goals: f.goals.map((g, j) => j === gi ? { ...g, milestones: g.milestones.map((m, k) => k === mi ? value : m) } : g) }));

  const handleCreate = () => {
    const cleaned = {
      ...form,
      goals: form.goals.filter((g) => g.title.trim()).map((g) => ({ ...g, milestones: g.milestones.filter((m) => m.trim()) })),
    };
    if (!cleaned.title.trim()) return;
    createPlan.mutate(cleaned, {
      onSuccess: () => {
        setShowCreate(false);
        setForm({ title: "", description: "", goals: [{ title: "", description: "", planned_start: "", planned_end: "", milestones: [""] }] });
        toast.success("Behandlingsplan skapad!");
        // Open the progress configuration sheet
        setShowConfigureProgress(true);
      },
      onError: () => toast.error("Kunde inte skapa plan"),
    });
  };

  const handleCreateAndArchive = () => {
    if (activePlan) {
      archivePlan.mutate(activePlan.id);
    }
    handleCreate();
  };

  const completedGoals = activePlan?.goals?.filter((g) => g.status === "completed").length ?? 0;
  const totalGoals = activePlan?.goals?.length ?? 0;
  const progressPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const cycleStatus = (goal: TreatmentGoal) => {
    const order = ["not_started", "in_progress", "completed"];
    const next = order[(order.indexOf(goal.status) + 1) % order.length];
    updateGoalStatus.mutate({ goalId: goal.id, status: next });
  };

  return (
    <div className="space-y-4">
      {activePlan ? (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{activePlan.title}</h3>
                  {activePlan.description && <p className="text-sm text-muted-foreground mt-1">{activePlan.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowConfigureProgress(true)}>
                    <Palette className="h-3 w-3 mr-1" /> Designa vy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => archivePlan.mutate(activePlan.id)}>
                    <Archive className="h-3 w-3 mr-1" /> Arkivera
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={progressPercent} className="h-2 flex-1" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">{completedGoals} av {totalGoals} mål</span>
              </div>
            </CardContent>
          </Card>

          {activePlan.goals?.map((goal) => {
            const expanded = expandedGoals.has(goal.id);
            const milestoneDone = goal.milestones?.filter((m) => m.is_completed).length ?? 0;
            const milestoneTotal = goal.milestones?.length ?? 0;

            return (
              <Card key={goal.id}>
                <CardContent className="py-3">
                  <button className="flex items-center gap-3 w-full text-left" onClick={() => toggleGoal(goal.id)}>
                    {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <button onClick={(e) => { e.stopPropagation(); cycleStatus(goal); }} className="shrink-0">
                      {statusIcon(goal.status)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{goal.title}</p>
                      {milestoneTotal > 0 && <p className="text-xs text-muted-foreground">{milestoneDone}/{milestoneTotal} delmål</p>}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{statusLabel[goal.status]}</Badge>
                  </button>

                  {expanded && (
                    <div className="mt-3 ml-11 space-y-3">
                      {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                      {goal.planned_start && (
                        <p className="text-xs text-muted-foreground">
                          {goal.planned_start} → {goal.planned_end ?? "?"}
                        </p>
                      )}
                      {goal.milestones && goal.milestones.length > 0 && (
                        <div className="space-y-2">
                          {goal.milestones.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={m.is_completed}
                                onCheckedChange={(checked) => toggleMilestone.mutate({ milestoneId: m.id, completed: !!checked })}
                              />
                              <span className={`text-sm ${m.is_completed ? "line-through text-muted-foreground" : ""}`}>{m.title}</span>
                              {m.is_completed && m.completed_at && (
                                <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                                  Klar {new Date(m.completed_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                      {goal.notes && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-xs text-muted-foreground">Anteckning</p>
                          <p className="text-sm">{goal.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Ingen aktiv behandlingsplan.</p>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Skapa behandlingsplan</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
                <DialogHeader><DialogTitle>Ny behandlingsplan</DialogTitle></DialogHeader>
                <CreatePlanForm form={form} setForm={setForm} addGoal={addGoal} removeGoal={removeGoal} updateGoal={updateGoal} addMilestone={addMilestone} updateMilestone={updateMilestone} onSubmit={handleCreate} isPending={createPlan.isPending} patientId={patientId} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {activePlan && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Ny plan (arkiverar nuvarande)</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>Ny behandlingsplan</DialogTitle></DialogHeader>
            <CreatePlanForm form={form} setForm={setForm} addGoal={addGoal} removeGoal={removeGoal} updateGoal={updateGoal} addMilestone={addMilestone} updateMilestone={updateMilestone} onSubmit={handleCreateAndArchive} isPending={createPlan.isPending} patientId={patientId} />
          </DialogContent>
        </Dialog>
      )}

      {/* Archived */}
      {archivedPlans.length > 0 && (
        <Collapsible open={showArchived} onOpenChange={setShowArchived}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              {showArchived ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
              Arkiverade planer ({archivedPlans.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {archivedPlans.map((plan) => (
              <Card key={plan.id} className="opacity-60">
                <CardContent className="py-3">
                  <p className="text-sm font-medium">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">{plan.goals?.filter((g) => g.status === "completed").length}/{plan.goals?.length} mål avklarade</p>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <ConfigureProgressSheet
        open={showConfigureProgress}
        onOpenChange={setShowConfigureProgress}
        patientId={patientId}
      />
    </div>
  );
}

function CreatePlanForm({ form, setForm, addGoal, removeGoal, updateGoal, addMilestone, updateMilestone, onSubmit, isPending, patientId }: any) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-treatment-plan", {
        body: { patientId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const plan = data.plan;
      setForm({
        title: plan.title || "",
        description: plan.description || "",
        goals: (plan.goals || []).map((g: any) => ({
          title: g.title || "",
          description: g.description || "",
          planned_start: g.planned_start || "",
          planned_end: g.planned_end || "",
          milestones: g.milestones?.length ? g.milestones : [""],
        })),
      });
      toast.success("AI-förslag tillämpat! Granska och justera innan du sparar.");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Kunde inte generera AI-förslag");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleAiSuggest}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {aiLoading ? "Genererar förslag…" : "AI-förslag baserat på journal"}
        </Button>
      </div>

      <Input placeholder="Plantitel" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} />
      <Textarea placeholder="Beskrivning (valfritt)" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} rows={2} />

      <div className="space-y-4">
        <p className="text-sm font-medium">Mål</p>
        {form.goals.map((g: any, i: number) => (
          <Card key={i}>
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder={`Mål ${i + 1}`} value={g.title} onChange={(e: any) => updateGoal(i, "title", e.target.value)} />
                {form.goals.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeGoal(i)}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
              <Textarea placeholder="Beskrivning" value={g.description} onChange={(e: any) => updateGoal(i, "description", e.target.value)} rows={1} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" placeholder="Start" value={g.planned_start} onChange={(e: any) => updateGoal(i, "planned_start", e.target.value)} />
                <Input type="date" placeholder="Slut" value={g.planned_end} onChange={(e: any) => updateGoal(i, "planned_end", e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Delmål</p>
                {g.milestones.map((m: string, j: number) => (
                  <Input key={j} placeholder={`Delmål ${j + 1}`} value={m} onChange={(e: any) => updateMilestone(i, j, e.target.value)} className="text-sm" />
                ))}
                <Button variant="ghost" size="sm" onClick={() => addMilestone(i)} className="text-xs"><Plus className="h-3 w-3 mr-1" /> Delmål</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" size="sm" onClick={addGoal}><Plus className="h-4 w-4 mr-1" /> Lägg till mål</Button>
      </div>

      <Button className="w-full gap-2" onClick={onSubmit} disabled={!form.title.trim() || isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Palette className="h-4 w-4" /> Spara & designa utvecklingsvy</>}
      </Button>
    </div>
  );
}
