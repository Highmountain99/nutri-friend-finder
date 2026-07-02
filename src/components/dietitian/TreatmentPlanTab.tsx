import { useState, useEffect } from "react";
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
  const { activePlan, archivedPlans, createPlan, updateGoalStatus, toggleMilestone, archivePlan, updatePlan, updateGoal: updateGoalMut, deleteGoal, addGoal: addGoalMut, addMilestone: addMilestoneMut, updateMilestone: updateMilestoneMut, deleteMilestone } = useTreatmentPlan(patientId);
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
        setForm({ title: "", description: "", end_goal: "", end_goal_target_date: "", goals: [{ title: "", description: "", planned_start: "", planned_end: "", milestones: [""] }] });
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
                <div className="min-w-0">
                  <h3 className="font-semibold">{activePlan.title}</h3>
                  {activePlan.description && <p className="text-sm text-muted-foreground mt-1">{activePlan.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setShowEditPlan(true)}>
                    <Pencil className="h-3 w-3 mr-1" /> Redigera
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowConfigureProgress(true)}>
                    <Palette className="h-3 w-3 mr-1" /> Designa vy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => archivePlan.mutate(activePlan.id)}>
                    <Archive className="h-3 w-3 mr-1" /> Arkivera
                  </Button>
                </div>
              </div>
              {(activePlan.end_goal || activePlan.end_goal_target_date) && (
                <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Slutmål</p>
                    <p className="text-sm font-medium">{activePlan.end_goal || "—"}</p>
                    {activePlan.end_goal_target_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">Måldatum: {activePlan.end_goal_target_date}</p>
                    )}
                  </div>
                </div>
              )}
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
                  <div className="flex items-center gap-3 w-full">
                    <button onClick={() => toggleGoal(goal.id)} className="shrink-0">
                      {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => cycleStatus(goal)} className="shrink-0">
                      {statusIcon(goal.status)}
                    </button>
                    <button className="flex-1 min-w-0 text-left" onClick={() => toggleGoal(goal.id)}>
                      <p className="text-sm font-medium truncate">{goal.title}</p>
                      {milestoneTotal > 0 && <p className="text-xs text-muted-foreground">{milestoneDone}/{milestoneTotal} delmål</p>}
                    </button>
                    <Badge variant="outline" className="text-xs shrink-0">{statusLabel[goal.status]}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingGoalId(goal.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

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
                            <label key={m.id} className="flex items-center gap-2 cursor-pointer group">
                              <Checkbox
                                checked={m.is_completed}
                                onCheckedChange={(checked) => toggleMilestone.mutate({ milestoneId: m.id, completed: !!checked })}
                              />
                              <span className={`text-sm flex-1 ${m.is_completed ? "line-through text-muted-foreground" : ""}`}>{m.title}</span>
                              {m.is_completed && m.completed_at && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  Klar {new Date(m.completed_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => { e.preventDefault(); if (confirm("Ta bort delmål?")) deleteMilestone.mutate(m.id); }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const title = prompt("Titel på nytt mål?");
              if (!title?.trim()) return;
              addGoalMut.mutate({
                planId: activePlan.id,
                title: title.trim(),
                sort_order: activePlan.goals?.length ?? 0,
              }, {
                onSuccess: () => toast.success("Mål tillagt"),
                onError: () => toast.error("Kunde inte lägga till mål"),
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Lägg till mål
          </Button>
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

      {activePlan && (
        <EditPlanDialog
          open={showEditPlan}
          onOpenChange={setShowEditPlan}
          plan={activePlan}
          onSave={(patch) => updatePlan.mutate(
            { planId: activePlan.id, ...patch },
            {
              onSuccess: () => { toast.success("Plan uppdaterad"); setShowEditPlan(false); },
              onError: () => toast.error("Kunde inte uppdatera plan"),
            }
          )}
          isPending={updatePlan.isPending}
        />
      )}

      {editingGoalId && activePlan && (
        <EditGoalDialog
          goal={activePlan.goals?.find((g) => g.id === editingGoalId)!}
          onClose={() => setEditingGoalId(null)}
          onSave={(patch) => updateGoalMut.mutate(
            { goalId: editingGoalId, ...patch },
            {
              onSuccess: () => { toast.success("Mål uppdaterat"); setEditingGoalId(null); },
              onError: () => toast.error("Kunde inte uppdatera mål"),
            }
          )}
          onDelete={() => {
            if (confirm("Ta bort mål och alla delmål?")) {
              deleteGoal.mutate(editingGoalId, {
                onSuccess: () => { toast.success("Mål borttaget"); setEditingGoalId(null); },
                onError: () => toast.error("Kunde inte ta bort mål"),
              });
            }
          }}
          onAddMilestone={(title) => addMilestoneMut.mutate({
            goalId: editingGoalId,
            title,
            sort_order: activePlan.goals?.find((g) => g.id === editingGoalId)?.milestones?.length ?? 0,
          })}
          onUpdateMilestone={(id, title) => updateMilestoneMut.mutate({ milestoneId: id, title })}
          onDeleteMilestone={(id) => deleteMilestone.mutate(id)}
          isPending={updateGoalMut.isPending}
        />
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
        end_goal: plan.end_goal || "",
        end_goal_target_date: plan.end_goal_target_date || "",
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

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Slutmål (visas i patientens resa)</p>
        </div>
        <Textarea
          placeholder="T.ex. Långsiktig magbalans utan symtom"
          value={form.end_goal}
          onChange={(e: any) => setForm({ ...form, end_goal: e.target.value })}
          rows={2}
        />
        <Input
          type="date"
          value={form.end_goal_target_date}
          onChange={(e: any) => setForm({ ...form, end_goal_target_date: e.target.value })}
        />
      </div>

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

function EditPlanDialog({
  open,
  onOpenChange,
  plan,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: any;
  onSave: (patch: { title: string; description: string | null; end_goal: string | null; end_goal_target_date: string | null }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(plan.title || "");
  const [description, setDescription] = useState(plan.description || "");
  const [endGoal, setEndGoal] = useState(plan.end_goal || "");
  const [endGoalDate, setEndGoalDate] = useState(plan.end_goal_target_date || "");

  // Reset when plan changes / dialog reopens
  useEffect(() => {
    if (open) {
      setTitle(plan.title || "");
      setDescription(plan.description || "");
      setEndGoal(plan.end_goal || "");
      setEndGoalDate(plan.end_goal_target_date || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
        <DialogHeader><DialogTitle>Redigera behandlingsplan</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Plantitel</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Beskrivning</p>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Slutmål (visas i patientens resa)</p>
            </div>
            <Textarea
              placeholder="T.ex. Långsiktig magbalans utan symtom"
              value={endGoal}
              onChange={(e) => setEndGoal(e.target.value)}
              rows={2}
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Måldatum (valfritt)</p>
              <Input type="date" value={endGoalDate} onChange={(e) => setEndGoalDate(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!title.trim() || isPending}
            onClick={() => onSave({
              title: title.trim(),
              description: description.trim() || null,
              end_goal: endGoal.trim() || null,
              end_goal_target_date: endGoalDate || null,
            })}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Spara ändringar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditGoalDialog({
  goal,
  onClose,
  onSave,
  onDelete,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  isPending,
}: {
  goal: TreatmentGoal;
  onClose: () => void;
  onSave: (patch: { title: string; description: string | null; planned_start: string | null; planned_end: string | null; notes: string | null }) => void;
  onDelete: () => void;
  onAddMilestone: (title: string) => void;
  onUpdateMilestone: (id: string, title: string) => void;
  onDeleteMilestone: (id: string) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(goal.title || "");
  const [description, setDescription] = useState(goal.description || "");
  const [start, setStart] = useState(goal.planned_start || "");
  const [end, setEnd] = useState(goal.planned_end || "");
  const [notes, setNotes] = useState(goal.notes || "");
  const [newMilestone, setNewMilestone] = useState("");

  useEffect(() => {
    setTitle(goal.title || "");
    setDescription(goal.description || "");
    setStart(goal.planned_start || "");
    setEnd(goal.planned_end || "");
    setNotes(goal.notes || "");
  }, [goal.id]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
        <DialogHeader><DialogTitle>Redigera mål</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Beskrivning" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Start</p>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Slut</p>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <Textarea placeholder="Anteckning" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Delmål</p>
            {goal.milestones?.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                onUpdate={(t) => onUpdateMilestone(m.id, t)}
                onDelete={() => onDeleteMilestone(m.id)}
              />
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Nytt delmål"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMilestone.trim()) {
                    onAddMilestone(newMilestone.trim());
                    setNewMilestone("");
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (newMilestone.trim()) {
                    onAddMilestone(newMilestone.trim());
                    setNewMilestone("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Ta bort mål
            </Button>
            <Button
              className="flex-1"
              disabled={!title.trim() || isPending}
              onClick={() => onSave({
                title: title.trim(),
                description: description.trim() || null,
                planned_start: start || null,
                planned_end: end || null,
                notes: notes.trim() || null,
              })}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Spara"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MilestoneRow({ milestone, onUpdate, onDelete }: { milestone: any; onUpdate: (t: string) => void; onDelete: () => void }) {
  const [value, setValue] = useState(milestone.title);
  return (
    <div className="flex gap-2 items-center">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { if (value.trim() && value !== milestone.title) onUpdate(value.trim()); }}
        className="text-sm"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
