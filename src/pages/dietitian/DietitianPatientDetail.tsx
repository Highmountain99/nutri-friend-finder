import { useParams, Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { usePatientJournal } from "@/hooks/dietitian/usePatientJournal";
import { useDietitianChat } from "@/hooks/dietitian/useDietitianChat";
import { useJournalEntries } from "@/hooks/dietitian/useJournalEntries";
import { useDietitianNotes } from "@/hooks/dietitian/useDietitianNotes";
import { usePatientDocuments } from "@/hooks/dietitian/usePatientDocuments";
import { useTreatmentPlan } from "@/hooks/dietitian/useTreatmentPlan";
import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, Send, Plus, Upload, FileText, Calendar, Clock, User, AlertTriangle, Check, Pencil, X, Bot, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { sv } from "date-fns/locale";
import { useState, useRef, useEffect, useCallback } from "react";
import { TreatmentPlanTab } from "@/components/dietitian/TreatmentPlanTab";
import { FoodLogTab } from "@/components/dietitian/FoodLogTab";
import { DietPatternsView } from "@/components/dietitian/DietPatternsView";
import { SymptomPatternCard } from "@/components/dietitian/SymptomPatternCard";
import { EditPatientGoalsSheet } from "@/components/dietitian/EditPatientGoalsSheet";
import { PatientHealthProfileCard } from "@/components/dietitian/PatientHealthProfileCard";
import { ConfigureProgressSheet } from "@/components/dietitian/ConfigureProgressSheet";
import { ClinicalNoteWizard } from "@/components/dietitian/clinical-notes/ClinicalNoteWizard";
import { getAreaConfig } from "@/components/dietitian/clinical-notes/areaConfigs/index";

const concernLabels: Record<string, string> = {
  weight_loss: "Viktnedgång",
  diabetes: "Diabetes",
  gut_health: "Maghälsa / IBS",
  general_health: "Allmän hälsa",
  womens_health: "Kvinnohälsa",
  emotional_eating: "Emotionellt ätande",
  eating_disorder: "Ätstörning",
  heart_health: "Hjärthälsa",
};

const motivationColors: Record<string, string> = {
  excited: "bg-primary/10 text-primary",
  curious: "bg-yellow-100 text-yellow-700",
  hesitant: "bg-orange-100 text-orange-700",
  not_ready: "bg-destructive/10 text-destructive",
};

const motivationLabels: Record<string, string> = {
  excited: "Jag är taggad",
  curious: "Nyfiken",
  hesitant: "Tveksam",
  not_ready: "Inte redo",
};

const activityLabels: Record<string, string> = {
  sedentary: "Stillasittande",
  lightly_active: "Lätt aktiv",
  moderately_active: "Måttligt aktiv",
  active: "Aktiv",
  very_active: "Mycket aktiv",
};

export default function DietitianPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { meals, symptoms, healthTracking, goals, intakeProfile, nutritionSettings, isLoading } = usePatientJournal(id);
  const { messages, sendMessage, approveDraft, rejectAndReplace, dismissDraft } = useDietitianChat(id);
  const { entries: journalEntries, addEntry, deleteEntry } = useJournalEntries(id);
  const { notes, upsertNote } = useDietitianNotes(id);
  const { documents, uploadDocument } = usePatientDocuments(id);
  const { activePlan } = useTreatmentPlan(id);
  const { data: patients } = useAssignedPatients();

  const [activeTab, setActiveTab] = useState("overview");
  const [editGoalsOpen, setEditGoalsOpen] = useState(false);
  const [configProgressOpen, setConfigProgressOpen] = useState(false);
  const [clinicalNoteOpen, setClinicalNoteOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalForm, setJournalForm] = useState({ anamnesis: "", assessment: "", action: "", next_steps: "" });
  const [freeNoteText, setFreeNoteText] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteInitialized, setNoteInitialized] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  useEffect(() => {
    if (notes.data && notes.data.length > 0 && !noteInitialized) {
      setNoteContent(notes.data[0].content);
      setNoteInitialized(true);
    }
  }, [notes.data, noteInitialized]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    sendMessage.mutate({ content: chatInput.trim() });
    setChatInput("");
  };

  const handleSaveJournal = () => {
    addEntry.mutate(journalForm, {
      onSuccess: () => {
        setShowJournalForm(false);
        setJournalForm({ anamnesis: "", assessment: "", action: "", next_steps: "" });
      },
    });
  };

  const handleSaveClinicalNote = (entry: {
    anamnesis: string;
    assessment: string;
    action: string;
    next_steps: string;
    form_data?: Record<string, any>;
    area_type?: string;
  }) => {
    addEntry.mutate(entry, {
      onSuccess: () => {
        setClinicalNoteOpen(false);
        toast.success("Journalanteckning sparad");
      },
    });
  };

  const handleSaveNote = useCallback(() => {
    const existingNote = notes.data?.[0];
    upsertNote.mutate({ id: existingNote?.id, content: noteContent });
  }, [noteContent, notes.data, upsertNote]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadDocument.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const intake = intakeProfile.data;
  const concern = intake?.unified_concern_category || intake?.primary_concern_category;

  // Health profile data
  const nutritionGoals = goals.data;
  const weightEntries = (healthTracking.data ?? []).filter((h) => h.metric_type === "weight");
  const latestWeight = weightEntries[0]?.value;
  const heightCm = intake?.ai_parsed_fields && typeof intake.ai_parsed_fields === "object" ? (intake.ai_parsed_fields as any).height_cm : null;
  const bmi = latestWeight && heightCm ? (Number(latestWeight) / ((Number(heightCm) / 100) ** 2)).toFixed(1) : null;

  // Treatment plan progress
  const planGoals = activePlan?.goals ?? [];
  const completedGoals = planGoals.filter((g) => g.status === "completed").length;
  const planProgress = planGoals.length > 0 ? Math.round((completedGoals / planGoals.length) * 100) : 0;
  const nextMilestone = planGoals
    .flatMap((g) => g.milestones ?? [])
    .find((m) => !m.is_completed);

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dietitian/patients">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {(() => {
              const patient = patients?.find((p) => p.patient_id === id);
              return patient ? getPatientDisplayName(patient) : `Patient ${id?.slice(0, 8)}`;
            })()}
          </h1>
          {concern && <Badge variant="secondary" className="mt-1">{concernLabels[concern] ?? concern}</Badge>}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Översikt</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="foodlog">Kostdagbok</TabsTrigger>
              <TabsTrigger value="treatment">Behandlingsplan</TabsTrigger>
              <TabsTrigger value="visits">Diet</TabsTrigger>
              <TabsTrigger value="documents">Dokument</TabsTrigger>
              <TabsTrigger value="chat">Chatt</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Health profile card */}
              <PatientHealthProfileCard
                patientId={id!}
                intakeData={intake}
                healthTrackingData={healthTracking.data ?? []}
                nutritionSettings={nutritionSettings.data}
              />

              {/* Intake profile card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Klientens profil från registrering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {intake ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Söker vård för</p>
                          <p className="font-medium">{intake.care_seeker_type === "self" ? "Sig själv" : "Annan person"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Primärt fokus</p>
                          <Badge variant="secondary">{concernLabels[concern ?? ""] ?? concern}</Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Aktivitetsnivå</p>
                          <p className="font-medium">{activityLabels[intake.activity_level ?? ""] ?? intake.activity_level ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Motivationsnivå</p>
                          {intake.motivation_level && (
                            <Badge className={`${motivationColors[intake.motivation_level]} border-0`}>
                              {motivationLabels[intake.motivation_level]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {intake.support_areas && intake.support_areas.length > 0 && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Önskade stödområden</p>
                          <div className="flex flex-wrap gap-1">
                            {intake.support_areas.map((area) => (
                              <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {intake.concern_tags && intake.concern_tags.length > 0 && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Allergier / intoleranser</p>
                          <div className="flex flex-wrap gap-1">
                            {intake.concern_tags.map((tag) => (
                              <Badge key={tag} variant="destructive" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen kvalificeringsdata tillgänglig.</p>
                  )}
                </CardContent>
              </Card>

              {/* Nutrition goals */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Näringsmål</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setEditGoalsOpen(true)}>
                    <Pencil className="h-3 w-3 mr-1" /> Justera
                  </Button>
                </CardHeader>
                <CardContent>
                  {nutritionGoals ? (
                    <>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div><p className="text-lg font-bold">{nutritionGoals.calories_goal}</p><p className="text-xs text-muted-foreground">kcal</p></div>
                        <div><p className="text-lg font-bold">{nutritionGoals.protein_goal}g</p><p className="text-xs text-muted-foreground">Protein</p></div>
                        <div><p className="text-lg font-bold">{nutritionGoals.carbs_goal}g</p><p className="text-xs text-muted-foreground">Kolhydrater</p></div>
                        <div><p className="text-lg font-bold">{nutritionGoals.fat_goal}g</p><p className="text-xs text-muted-foreground">Fett</p></div>
                      </div>
                      {nutritionGoals.set_by_dietist && (
                        <p className="text-xs text-primary mt-2">✓ Satta av dietist</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Inga mål satta ännu. Klicka "Justera" för att sätta mål.</p>
                  )}
                </CardContent>
              </Card>

              {/* Progress configuration */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Klientens utvecklingsvy</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setConfigProgressOpen(true)}>
                    <Pencil className="h-3 w-3 mr-1" /> Anpassa
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Välj template och synliga element för klientens utvecklingssida.
                  </p>
                </CardContent>
              </Card>

              <EditPatientGoalsSheet
                open={editGoalsOpen}
                onOpenChange={setEditGoalsOpen}
                patientId={id!}
                currentGoals={nutritionGoals}
              />

              <ConfigureProgressSheet
                open={configProgressOpen}
                onOpenChange={setConfigProgressOpen}
                patientId={id!}
              />

              {/* Quick notes */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Anteckningar</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Textarea placeholder="Skriv snabbanteckningar om klienten..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={4} />
                  <Button size="sm" onClick={handleSaveNote} disabled={upsertNote.isPending}>Spara</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Journal tab */}
            <TabsContent value="journal" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Journalanteckningar</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={() => setClinicalNoteOpen(true)}>
                    <FileText className="h-4 w-4 mr-1" /> Nytt besök
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowJournalForm(!showJournalForm)}>
                    <Plus className="h-4 w-4 mr-1" /> Fri anteckning
                  </Button>
                </div>
              </div>
              {showJournalForm && (
                <Card>
                  <CardContent className="space-y-3 pt-4">
                    <Textarea
                      placeholder="Skriv en fri anteckning..."
                      value={freeNoteText}
                      onChange={(e) => setFreeNoteText(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => {
                        if (!freeNoteText.trim()) return;
                        addEntry.mutate({ anamnesis: freeNoteText.trim() }, {
                          onSuccess: () => {
                            setShowJournalForm(false);
                            setFreeNoteText("");
                            toast.success("Anteckning sparad");
                          },
                        });
                      }} disabled={addEntry.isPending || !freeNoteText.trim()}>Spara</Button>
                      <Button size="sm" variant="outline" onClick={() => { setShowJournalForm(false); setFreeNoteText(""); }}>Avbryt</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!journalEntries.data?.length ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Inga journalanteckningar ännu.</p>
              ) : (
                journalEntries.data.map((entry) => {
                  const isExpanded = expandedEntryId === entry.id;
                  const areaLabel = entry.area_type ? getAreaConfig(entry.area_type)?.title : null;
                  const hasDetails = entry.anamnesis || entry.assessment || entry.action || entry.next_steps;
                  return (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardContent className="py-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 cursor-pointer" onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-muted-foreground">{format(new Date(entry.created_at), "d MMMM yyyy, HH:mm", { locale: sv })}</p>
                              {areaLabel && <Badge variant="secondary" className="text-xs">{areaLabel}</Badge>}
                              {!areaLabel && !entry.area_type && <Badge variant="outline" className="text-xs">Fri anteckning</Badge>}
                            </div>
                            {!isExpanded && entry.anamnesis && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.anamnesis}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {hasDetails && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ta bort journalanteckning?</AlertDialogTitle>
                                  <AlertDialogDescription>Denna åtgärd kan inte ångras.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteEntry.mutate(entry.id, { onSuccess: () => toast.success("Anteckning borttagen") })}
                                  >
                                    Ta bort
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="space-y-4 pt-3 border-t">
                            {entry.anamnesis && (
                              <div>
                                <p className="text-xs font-semibold text-primary mb-2">Anamnes</p>
                                <div className="space-y-1">
                                  {entry.anamnesis.split("\n").map((line, i) => {
                                    const colonIdx = line.indexOf(":");
                                    if (colonIdx > 0 && colonIdx < 30) {
                                      const label = line.slice(0, colonIdx);
                                      const value = line.slice(colonIdx + 1).trim();
                                      return (
                                        <p key={i} className="text-sm">
                                          <span className="font-medium text-foreground">{label}:</span>{" "}
                                          <span className="text-muted-foreground">{value}</span>
                                        </p>
                                      );
                                    }
                                    return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
                                  })}
                                </div>
                              </div>
                            )}
                            {entry.assessment && (
                              <div>
                                <p className="text-xs font-semibold text-primary mb-1">Bedömning</p>
                                <p className="text-sm whitespace-pre-wrap">{entry.assessment}</p>
                              </div>
                            )}
                            {entry.action && (
                              <div>
                                <p className="text-xs font-semibold text-primary mb-1">Åtgärd</p>
                                <ul className="space-y-1">
                                  {entry.action.split("\n").map((line, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>{line}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {entry.next_steps && (
                              <div>
                                <p className="text-xs font-semibold text-primary mb-1">Nästa steg</p>
                                <p className="text-sm whitespace-pre-wrap">{entry.next_steps}</p>
                              </div>
                            )}
                            {entry.form_data && Object.keys(entry.form_data as object).length > 0 && (
                              <details className="text-xs">
                                <summary className="text-muted-foreground cursor-pointer hover:text-foreground">Visa rådata från formulär</summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-48">{JSON.stringify(entry.form_data, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
              <ClinicalNoteWizard
                open={clinicalNoteOpen}
                onOpenChange={setClinicalNoteOpen}
                patientId={id!}
                onSave={handleSaveClinicalNote}
                isSaving={addEntry.isPending}
              />
            </TabsContent>

            {/* Food Log tab */}
            <TabsContent value="foodlog" className="mt-4">
              {id && <FoodLogTab patientId={id} />}
            </TabsContent>

            {/* Treatment Plan tab */}
            <TabsContent value="treatment" className="mt-4">
              {id && <TreatmentPlanTab patientId={id} />}
            </TabsContent>

            {/* Diet tab */}
            <TabsContent value="visits" className="mt-4">
              <DietPatternsView meals={(meals.data ?? []) as any} symptoms={(symptoms.data ?? []) as any} />
            </TabsContent>


            {/* Documents tab */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) uploadDocument.mutate(file); }}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Dra och släpp filer här, eller klicka för att välja</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              </div>
              {documents.data?.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(doc.created_at), "d MMM yyyy", { locale: sv })}</p>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">Öppna</Button></a>
                </div>
              ))}
            </TabsContent>

            {/* Chat tab */}
            <TabsContent value="chat" className="mt-4">
              <Card className="h-[500px] flex flex-col overflow-hidden">
                <CardContent className="flex-1 min-h-0 overflow-y-auto py-4 space-y-3">
                  {messages.data?.filter((m) => (m as any).status !== 'rejected').map((m) => {
                    const isDraft = (m as any).status === 'draft';
                    const isEditing = editingDraftId === m.id;

                    if (isDraft) {
                      return (
                        <div key={m.id} className="mx-auto max-w-[90%]">
                          <div className="border border-dashed border-primary/40 rounded-xl p-3 bg-primary/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                                <Bot className="h-3.5 w-3.5" />
                                AI-förslag till svar
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => dismissDraft.mutate(m.id)}
                                disabled={dismissDraft.isPending}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {isEditing ? (
                              <>
                                <Textarea
                                  value={editedContent}
                                  onChange={(e) => setEditedContent(e.target.value)}
                                  rows={4}
                                  className="text-sm"
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingDraftId(null)}>
                                    <X className="h-3.5 w-3.5 mr-1" /> Avbryt
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      rejectAndReplace.mutate({ draftId: m.id, newContent: editedContent });
                                      setEditingDraftId(null);
                                    }}
                                    disabled={!editedContent.trim() || rejectAndReplace.isPending}
                                  >
                                    <Send className="h-3.5 w-3.5 mr-1" /> Skicka
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{m.content}</p>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setEditingDraftId(m.id); setEditedContent(m.content); }}
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-1" /> Redigera & skicka
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => approveDraft.mutate(m.id)}
                                    disabled={approveDraft.isPending}
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" /> Godkänn & skicka
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={m.id} className={`flex ${m.sender === "dietitian" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                          m.sender === "dietitian" ? "bg-primary text-primary-foreground"
                            : m.sender === "ai" ? "bg-muted text-muted-foreground italic"
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </CardContent>
                <div className="p-3 border-t flex gap-2">
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Skriv ett meddelande..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                  <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending}><Send className="h-4 w-4" /></Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick info with health data */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Snabbinfo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient-ID</span>
                <span className="font-mono text-xs">{id?.slice(0, 12)}</span>
              </div>
              {intake?.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registrerad</span>
                  <span>{format(new Date(intake.completed_at), "d MMM yyyy", { locale: sv })}</span>
                </div>
              )}
              {concern && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fokusområde</span>
                  <Badge variant="secondary" className="text-xs">{concernLabels[concern] ?? concern}</Badge>
                </div>
              )}
              {latestWeight && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vikt</span>
                  <span>{latestWeight} kg</span>
                </div>
              )}
              {bmi && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">BMI</span>
                  <span className="flex items-center gap-1">
                    {bmi}
                    {(Number(bmi) < 18.5 || Number(bmi) > 30) && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Treatment plan progress */}
          {activePlan && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pågående behandling</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{activePlan.title}</p>
                <div className="flex items-center gap-2">
                  <Progress value={planProgress} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground">{completedGoals}/{planGoals.length}</span>
                </div>
                {nextMilestone && (
                  <p className="text-xs text-muted-foreground">Nästa: {nextMilestone.title}</p>
                )}
                <Button variant="ghost" size="sm" className="text-xs p-0 h-auto text-primary" onClick={() => setActiveTab("treatment")}>
                  Visa plan →
                </Button>
              </CardContent>
            </Card>
          )}
          {/* Symptom patterns */}
          {id && <SymptomPatternCard patientId={id} onNavigate={() => setActiveTab("foodlog")} />}

          {/* Activity log */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Aktivitetslogg</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {symptoms.data?.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-start gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                  <div>
                    <p className="text-xs">Symtom rapporterat: {s.description.slice(0, 40)}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.created_at ?? s.entry_date), { addSuffix: true, locale: sv })}</p>
                  </div>
                </div>
              ))}
              {healthTracking.data?.slice(0, 3).map((h) => (
                <div key={h.id} className="flex items-start gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                  <div>
                    <p className="text-xs">{h.metric_type}: {h.value} {h.unit}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(h.entry_date), { addSuffix: true, locale: sv })}</p>
                  </div>
                </div>
              ))}
              {!symptoms.data?.length && !healthTracking.data?.length && (
                <p className="text-xs text-muted-foreground text-center py-2">Ingen aktivitet ännu.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
