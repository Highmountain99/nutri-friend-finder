import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Circle } from "lucide-react";
import * as Icons from "lucide-react";
import { ComputedBlockData } from "@/hooks/usePatientBlocks";

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  journal: { label: "Från journal", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  dietitian: { label: "Din dietist", className: "bg-blue-50 text-blue-700 border-blue-200" },
  manual: { label: "Din dietist", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

function getIcon(iconName: string) {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className="h-4 w-4" /> : <Icons.Square className="h-4 w-4" />;
}

interface DynamicBlockProps {
  data: ComputedBlockData;
}

export function DynamicBlock({ data }: DynamicBlockProps) {
  const { block, computedLabel, computedItems, computedValue, computedTotal, source } = data;
  const template = block.template;
  const title = block.override_title || template.title;
  const badge = SOURCE_BADGES[source] || SOURCE_BADGES.manual;

  return (
    <Card className="p-3.5 border-border/60">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/8 text-primary shrink-0">
          {getIcon(template.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{title}</h4>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${badge.className} shrink-0`}>
              {badge.label}
            </Badge>
          </div>

          {/* Checklist items (meal rhythm etc.) */}
          {computedItems.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
              {computedItems.map((item) => (
                <div key={item.key} className="flex items-center gap-1.5">
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                  )}
                  <span className={`text-xs ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {computedValue !== null && computedTotal !== null && computedItems.length === 0 && (
            <div className="mt-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold text-primary">{computedValue}</span>
                <span className="text-xs text-muted-foreground">/ {computedTotal}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div
                  className="bg-primary rounded-full h-1.5 transition-all"
                  style={{ width: `${Math.min((computedValue / computedTotal) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Simple label */}
          {computedLabel && computedItems.length === 0 && computedTotal === null && (
            <p className="text-xs text-muted-foreground mt-0.5">{computedLabel}</p>
          )}

          {/* Label with value but no total */}
          {computedLabel && computedValue !== null && computedTotal === null && (
            <p className="text-xs text-muted-foreground mt-0.5">{computedLabel}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
