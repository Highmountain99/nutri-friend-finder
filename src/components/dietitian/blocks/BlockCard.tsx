import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BlockTemplate } from "@/hooks/dietitian/useBlockTemplates";
import { BlockPreview } from "./BlockPreview";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  action: "Åtgärd",
  insight: "Insikt",
  progress: "Progression",
  test: "Test",
  reflection: "Reflektion",
  follow_up: "Uppföljning",
};

const DATA_SOURCE_LABELS: Record<string, string> = {
  none: "Manuellt",
  journal: "Journal",
  meal_log: "Kostlogg",
  meal_times: "Måltidstider",
  symptom_log: "Symptomlogg",
  macro_data: "Makrodata",
  treatment_goals: "Behandlingsmål",
  treatment_plan: "Behandlingsplan",
  progression: "Progression",
  combined: "Kombinerad",
  health_tracking: "Hälsodata",
  appointments: "Bokningar",
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Allmänt",
  gut_health: "Maghälsa",
  ibs: "IBS",
  diabetes: "Diabetes",
  eating_disorder: "Ätstörning",
  heart_health: "Hjärthälsa",
  womens_health: "Kvinnohälsa",
  pregnancy: "Graviditet",
  weight_loss: "Viktminskning",
};

interface BlockCardProps {
  template: BlockTemplate;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BlockCard({ template, onEdit, onDelete }: BlockCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      {/* Preview area */}
      <div className="p-3 pb-0">
        <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
          <div className="transform scale-[0.92] origin-top">
            <BlockPreview
              title={template.title}
              description={template.description}
              icon={template.icon}
              dataSource={template.data_source}
              dataConfig={template.data_config || {}}
              displayConfig={template.display_config || {}}
              blockType={template.block_type}
            />
          </div>
        </div>
      </div>

      {/* Footer with badges + menu */}
      <div className="p-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 min-w-0">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {BLOCK_TYPE_LABELS[template.block_type] || template.block_type}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {CATEGORY_LABELS[template.category] || template.category}
            </Badge>
            {template.data_source !== "none" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                {DATA_SOURCE_LABELS[template.data_source] || template.data_source}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" /> Redigera
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Ta bort
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

export { BLOCK_TYPE_LABELS, DATA_SOURCE_LABELS, CATEGORY_LABELS };
