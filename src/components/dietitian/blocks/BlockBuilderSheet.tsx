import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BlockDataConfig } from "./BlockDataConfig";
import { BlockPreview } from "./BlockPreview";
import { useCreateBlockTemplate, useUpdateBlockTemplate, BlockTemplate, BlockTemplateInput } from "@/hooks/dietitian/useBlockTemplates";
import { BLOCK_TYPE_LABELS, CATEGORY_LABELS } from "./BlockCard";

const ICON_OPTIONS = [
  "Square", "Heart", "Apple", "Utensils", "Activity", "Brain", "Flame",
  "Target", "TrendingUp", "Calendar", "Clock", "AlertCircle", "Smile",
  "CheckCircle", "Star", "Zap", "Droplets", "Leaf", "Sun", "Moon",
];

const BEHAVIOR_MODES = [
  { value: "manual", label: "Manuellt block", desc: "Statisk text som dietisten sätter per patient" },
  { value: "auto", label: "Automatiskt block", desc: "Fylls i från patientens data" },
  { value: "hybrid", label: "Hybrid", desc: "Kombination av data och manuell text" },
];

const BLOCK_ROLE_OPTIONS = [
  { value: "action", label: "Action", desc: "Gör detta" },
  { value: "insight", label: "Insikt", desc: "Förstå detta" },
  { value: "progress", label: "Progress", desc: "Du är här" },
  { value: "test", label: "Test", desc: "Experiment / utmaning" },
  { value: "reflection", label: "Reflektion", desc: "Tänk kring detta" },
  { value: "follow_up", label: "Uppföljning", desc: "Nästa steg" },
];

const DISPLAY_MODE_OPTIONS = [
  { value: "checklist", label: "Checklista" },
  { value: "status_card", label: "Statuskort" },
  { value: "progress_bar", label: "Progress" },
  { value: "insight", label: "Insikt" },
];

const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "encouraging", label: "Uppmuntrande" },
  { value: "informative", label: "Informativ" },
];

const VISIBILITY_OPTIONS = [
  { value: "always", label: "Alltid" },
  { value: "when_data", label: "Endast när data finns" },
  { value: "when_active", label: "Endast när aktiv" },
];

const PROGRESSION_OPTIONS = [
  { value: "none", label: "Ingen" },
  { value: "daily_check", label: "Dagligt (check)" },
  { value: "weekly_goal", label: "Veckovis mål" },
  { value: "streak", label: "Streak (X dagar i rad)" },
  { value: "time_limited", label: "Tidsbaserat (t.ex. 7 dagars test)" },
];

const PLAN_USAGE_OPTIONS = [
  { value: "active", label: "Aktivt block" },
  { value: "upcoming", label: "Kommande block" },
  { value: "unlockable", label: "Låses upp vid progress" },
];

interface BlockBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTemplate?: BlockTemplate | null;
}

function SectionHeader({ title, badge, open, onToggle }: { title: string; badge?: string; open: boolean; onToggle: () => void }) {
  return (
    <CollapsibleTrigger onClick={onToggle} className="flex items-center justify-between w-full py-2 group">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{title}</span>
        {badge && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{badge}</Badge>}
      </div>
      {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
    </CollapsibleTrigger>
  );
}

export function BlockBuilderSheet({ open, onOpenChange, editTemplate }: BlockBuilderSheetProps) {
  const create = useCreateBlockTemplate();
  const update = useUpdateBlockTemplate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Square");
  const [blockType, setBlockType] = useState("action");
  const [category, setCategory] = useState("general");
  const [dataSource, setDataSource] = useState("none");
  const [dataConfig, setDataConfig] = useState<Record<string, any>>({});
  const [displayConfig, setDisplayConfig] = useState<Record<string, any>>({});
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editTemplate?.title || "");
      setDescription(editTemplate?.description || "");
      setIcon(editTemplate?.icon || "Square");
      setBlockType(editTemplate?.block_type || "action");
      setCategory(editTemplate?.category || "general");
      setDataSource(editTemplate?.data_source || "none");
      setDataConfig(editTemplate?.data_config || {});
      setDisplayConfig(editTemplate?.display_config || {});
      setIsShared(editTemplate?.is_shared || false);
    }
  }, [open, editTemplate]);

  // Behavior mode derived from data source
  const behaviorMode = dataSource === "none"
    ? "manual"
    : (dataConfig.has_manual_text ? "hybrid" : "auto");

  const setBehaviorMode = (mode: string) => {
    if (mode === "manual") {
      setDataSource("none");
      setDataConfig({});
    } else if (mode === "auto") {
      if (dataSource === "none") setDataSource("meal_log");
      setDataConfig({ ...dataConfig, has_manual_text: false });
    } else {
      if (dataSource === "none") setDataSource("meal_log");
      setDataConfig({ ...dataConfig, has_manual_text: true });
    }
  };

  // Section open state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    behavior: true,
    data: true,
    progression: false,
    patient_view: false,
    role: false,
    plan: false,
    settings: false,
  });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const saving = create.isPending || update.isPending;

  const handleSave = async () => {
    const input: BlockTemplateInput = {
      title,
      description,
      icon,
      block_type: blockType,
      category,
      data_source: dataSource,
      data_config: dataConfig,
      display_config: displayConfig,
      is_shared: isShared,
    };

    if (editTemplate) {
      await update.mutateAsync({ id: editTemplate.id, ...input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg w-full p-0">
        <div className="p-6 pb-3">
          <SheetHeader className="text-left">
            <SheetTitle>{editTemplate ? "Redigera block" : "Bygg ett nytt block"}</SheetTitle>
            <SheetDescription>Definiera hur blocket ser ut, beter sig och kopplas till data.</SheetDescription>
          </SheetHeader>
        </div>

        <div className="space-y-1 px-6 pb-6">
          {/* ========== LIVE PREVIEW (always visible at top) ========== */}
          <div className="space-y-2 pb-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Förhandsgranskning</Label>
            <BlockPreview
              title={title}
              description={description}
              icon={icon}
              dataSource={dataSource}
              dataConfig={dataConfig}
              displayConfig={displayConfig}
              blockType={blockType}
            />
          </div>

          <Separator />

          {/* ========== BASIC INFO ========== */}
          <div className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Titel</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="T.ex. Måltidsrytm idag" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kort beskrivning</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vad gör blocket?" className="rounded-xl min-h-[50px]" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ikon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Behandlingsområde</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* ========== SECTION: BEHAVIOR ========== */}
          <Collapsible open={openSections.behavior}>
            <SectionHeader
              title="Blockets beteende"
              badge={BEHAVIOR_MODES.find(b => b.value === behaviorMode)?.label}
              open={openSections.behavior}
              onToggle={() => toggleSection("behavior")}
            />
            <CollapsibleContent className="space-y-3 pb-3">
              <div className="grid gap-2">
                {BEHAVIOR_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setBehaviorMode(mode.value)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      behaviorMode === mode.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                      behaviorMode === mode.value ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      {behaviorMode === mode.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{mode.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ========== SECTION: DATA CONNECTION ========== */}
          {behaviorMode !== "manual" && (
            <>
              <Collapsible open={openSections.data}>
                <SectionHeader
                  title="Datakoppling"
                  badge={dataSource !== "none" ? "Konfigurerad" : undefined}
                  open={openSections.data}
                  onToggle={() => toggleSection("data")}
                />
                <CollapsibleContent className="space-y-3 pb-3">
                  <BlockDataConfig dataSource={dataSource} config={dataConfig} onChange={setDataConfig} onSourceChange={setDataSource} />
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* ========== SECTION: PROGRESSION ========== */}
          <Collapsible open={openSections.progression}>
            <SectionHeader
              title="Progression"
              badge={dataConfig.progression && dataConfig.progression !== "none" ? "Aktiv" : undefined}
              open={openSections.progression}
              onToggle={() => toggleSection("progression")}
            />
            <CollapsibleContent className="space-y-3 pb-3">
              <p className="text-xs text-muted-foreground">Hur mäts framsteg i detta block?</p>
              <div className="grid gap-2">
                {PROGRESSION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDataConfig({ ...dataConfig, progression: opt.value })}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      (dataConfig.progression || "none") === opt.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      (dataConfig.progression || "none") === opt.value ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      {(dataConfig.progression || "none") === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>

              {dataConfig.progression === "weekly_goal" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Mål per vecka</Label>
                  <Input
                    type="number"
                    value={dataConfig.progression_target || 5}
                    onChange={(e) => setDataConfig({ ...dataConfig, progression_target: parseInt(e.target.value) || 5 })}
                    className="rounded-xl w-24"
                    min={1}
                    max={7}
                  />
                  <p className="text-xs text-muted-foreground">dagar per vecka</p>
                </div>
              )}

              {dataConfig.progression === "streak" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Streak-mål</Label>
                  <Input
                    type="number"
                    value={dataConfig.progression_target || 7}
                    onChange={(e) => setDataConfig({ ...dataConfig, progression_target: parseInt(e.target.value) || 7 })}
                    className="rounded-xl w-24"
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">dagar i rad</p>
                </div>
              )}

              {dataConfig.progression === "time_limited" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Antal dagar</Label>
                  <Input
                    type="number"
                    value={dataConfig.progression_target || 7}
                    onChange={(e) => setDataConfig({ ...dataConfig, progression_target: parseInt(e.target.value) || 7 })}
                    className="rounded-xl w-24"
                    min={1}
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ========== SECTION: PATIENT VIEW ========== */}
          <Collapsible open={openSections.patient_view}>
            <SectionHeader
              title="Patientvy"
              open={openSections.patient_view}
              onToggle={() => toggleSection("patient_view")}
            />
            <CollapsibleContent className="space-y-3 pb-3">
              <p className="text-xs text-muted-foreground">Hur visas blocket för patienten?</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visa som</Label>
                <Select value={displayConfig.display_mode || "status_card"} onValueChange={(v) => setDisplayConfig({ ...displayConfig, display_mode: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISPLAY_MODE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ton</Label>
                <Select value={displayConfig.tone || "neutral"} onValueChange={(v) => setDisplayConfig({ ...displayConfig, tone: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visa blocket</Label>
                <Select value={displayConfig.visibility || "always"} onValueChange={(v) => setDisplayConfig({ ...displayConfig, visibility: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ========== SECTION: BLOCK ROLE ========== */}
          <Collapsible open={openSections.role}>
            <SectionHeader
              title="Blockroll"
              badge={BLOCK_ROLE_OPTIONS.find(r => r.value === blockType)?.label}
              open={openSections.role}
              onToggle={() => toggleSection("role")}
            />
            <CollapsibleContent className="space-y-2 pb-3">
              <p className="text-xs text-muted-foreground">Vad är blockets roll i behandlingen?</p>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setBlockType(role.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      blockType === role.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-sm font-medium">{role.label}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{role.desc}</p>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ========== SECTION: PLAN USAGE ========== */}
          <Collapsible open={openSections.plan}>
            <SectionHeader
              title="Koppling till plan"
              open={openSections.plan}
              onToggle={() => toggleSection("plan")}
            />
            <CollapsibleContent className="space-y-3 pb-3">
              <p className="text-xs text-muted-foreground">Hur används blocket i behandlingsplanen?</p>
              <div className="grid gap-2">
                {PLAN_USAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDisplayConfig({ ...displayConfig, plan_usage: opt.value })}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      (displayConfig.plan_usage || "active") === opt.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      (displayConfig.plan_usage || "active") === opt.value ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      {(displayConfig.plan_usage || "active") === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>

              {displayConfig.plan_usage === "unlockable" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Villkor för upplåsning</Label>
                  <Textarea
                    value={displayConfig.unlock_condition || ""}
                    onChange={(e) => setDisplayConfig({ ...displayConfig, unlock_condition: e.target.value })}
                    placeholder="T.ex. 5 dagar med stabil måltidsstruktur"
                    className="rounded-xl text-sm min-h-[50px]"
                    rows={2}
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ========== SECTION: SETTINGS ========== */}
          <Collapsible open={openSections.settings}>
            <SectionHeader title="Inställningar" open={openSections.settings} onToggle={() => toggleSection("settings")} />
            <CollapsibleContent className="space-y-3 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Dela med andra dietister</Label>
                  <p className="text-xs text-muted-foreground">Synligt i gemensamt bibliotek</p>
                </div>
                <Switch checked={isShared} onCheckedChange={setIsShared} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving || !title} className="w-full rounded-xl">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editTemplate ? "Uppdatera block" : "Skapa block"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
