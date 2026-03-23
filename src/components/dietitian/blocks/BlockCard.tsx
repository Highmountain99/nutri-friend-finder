import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BlockTemplate } from "@/hooks/dietitian/useBlockTemplates";
import * as Icons from "lucide-react";

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
  progression: "Progression",
  combined: "Kombinerad",
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Allmänt",
  ibs: "IBS",
  diabetes: "Diabetes",
  eating_disorder: "Ätstörning",
  heart_health: "Hjärthälsa",
  womens_health: "Kvinnohälsa",
  pregnancy: "Graviditet",
  weight_loss: "Viktminskning",
};

function getIcon(iconName: string) {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className="h-5 w-5" /> : <Icons.Square className="h-5 w-5" />;
}

interface BlockCardProps {
  template: BlockTemplate;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BlockCard({ template, onEdit, onDelete }: BlockCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {getIcon(template.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm truncate">{template.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
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
          {template.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {BLOCK_TYPE_LABELS[template.block_type] || template.block_type}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {CATEGORY_LABELS[template.category] || template.category}
            </Badge>
            {template.data_source !== "none" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {DATA_SOURCE_LABELS[template.data_source] || template.data_source}
              </Badge>
            )}
            {template.is_shared && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <Share2 className="h-2.5 w-2.5 mr-0.5" /> Delad
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export { BLOCK_TYPE_LABELS, DATA_SOURCE_LABELS, CATEGORY_LABELS };
