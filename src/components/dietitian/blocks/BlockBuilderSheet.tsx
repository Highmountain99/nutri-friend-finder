import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { BlockDataConfig } from "./BlockDataConfig";
import { BlockPreview } from "./BlockPreview";
import { useCreateBlockTemplate, useUpdateBlockTemplate, BlockTemplate, BlockTemplateInput } from "@/hooks/dietitian/useBlockTemplates";
import { BLOCK_TYPE_LABELS, CATEGORY_LABELS } from "./BlockCard";

const DATA_SOURCE_OPTIONS = [
  { value: "none", label: "Ingen (manuellt)" },
  { value: "meal_log", label: "Kostlogg" },
  { value: "meal_times", label: "Måltidstider" },
  { value: "symptom_log", label: "Symptomlogg" },
  { value: "macro_data", label: "Makro-/näringsdata" },
  { value: "treatment_goals", label: "Behandlingsmål" },
  { value: "progression", label: "Progressionsdata" },
];

const ICON_OPTIONS = [
  "Square", "Heart", "Apple", "Utensils", "Activity", "Brain", "Flame",
  "Target", "TrendingUp", "Calendar", "Clock", "AlertCircle", "Smile",
  "CheckCircle", "Star", "Zap", "Droplets", "Leaf", "Sun", "Moon",
];

interface BlockBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTemplate?: BlockTemplate | null;
}

export function BlockBuilderSheet({ open, onOpenChange, editTemplate }: BlockBuilderSheetProps) {
  const create = useCreateBlockTemplate();
  const update = useUpdateBlockTemplate();

  const [title, setTitle] = useState(editTemplate?.title || "");
  const [description, setDescription] = useState(editTemplate?.description || "");
  const [icon, setIcon] = useState(editTemplate?.icon || "Square");
  const [blockType, setBlockType] = useState(editTemplate?.block_type || "action");
  const [category, setCategory] = useState(editTemplate?.category || "general");
  const [dataSource, setDataSource] = useState(editTemplate?.data_source || "none");
  const [dataConfig, setDataConfig] = useState<Record<string, any>>(editTemplate?.data_config || {});
  const [isShared, setIsShared] = useState(editTemplate?.is_shared || false);

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
            <SheetTitle>{editTemplate ? "Redigera block" : "Skapa nytt block"}</SheetTitle>
            <SheetDescription>Definiera blockets innehåll och datakoppling.</SheetDescription>
          </SheetHeader>
        </div>

        <div className="space-y-5 px-6 pb-6">
          {/* Basic info */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Titel</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="T.ex. Måltidsrytm idag" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Beskrivning</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kort beskrivning av blocket" className="rounded-xl min-h-[60px]" />
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
                <Label className="text-xs font-medium">Blocktyp</Label>
                <Select value={blockType} onValueChange={setBlockType}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BLOCK_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

          <Separator />

          {/* Data source */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datakoppling</Label>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Datakälla</Label>
              <Select value={dataSource} onValueChange={(v) => { setDataSource(v); setDataConfig({}); }}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATA_SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <BlockDataConfig dataSource={dataSource} config={dataConfig} onChange={setDataConfig} />
          </div>

          <Separator />

          {/* Sharing */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Dela med andra dietister</Label>
              <p className="text-xs text-muted-foreground">Gör blocket synligt i gemensamt bibliotek</p>
            </div>
            <Switch checked={isShared} onCheckedChange={setIsShared} />
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Förhandsgranskning</Label>
            <BlockPreview title={title} description={description} icon={icon} dataSource={dataSource} dataConfig={dataConfig} />
          </div>

          <Button onClick={handleSave} disabled={saving || !title} className="w-full rounded-xl">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editTemplate ? "Uppdatera block" : "Skapa block"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
