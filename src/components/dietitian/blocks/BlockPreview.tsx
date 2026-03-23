import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Circle } from "lucide-react";
import * as Icons from "lucide-react";

interface BlockPreviewProps {
  title: string;
  description?: string;
  icon: string;
  dataSource: string;
  dataConfig: Record<string, any>;
}

function getIcon(iconName: string, className = "h-4 w-4") {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className={className} /> : <Icons.Square className={className} />;
}

export function BlockPreview({ title, description, icon, dataSource, dataConfig }: BlockPreviewProps) {
  const sourceBadge = dataSource === "none"
    ? { label: "Din dietist", color: "bg-blue-100 text-blue-700" }
    : { label: "Från journal", color: "bg-emerald-100 text-emerald-700" };

  const metric = dataConfig.metric || "";

  return (
    <Card className="p-3 bg-card border border-border">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
          {getIcon(icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate">{title || "Namnlöst block"}</h4>
            <Badge className={`text-[9px] px-1 py-0 ${sourceBadge.color} shrink-0`}>
              {sourceBadge.label}
            </Badge>
          </div>

          {/* Preview content based on data source */}
          {dataSource === "none" && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description || "Manuellt innehåll sätts per patient"}
            </p>
          )}

          {metric === "meal_rhythm" && (
            <div className="flex gap-3 mt-2">
              {["Frukost", "Lunch", "Middag", "Mellanmål"].map((meal, i) => (
                <div key={meal} className="flex items-center gap-1">
                  {i < 2 ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                  <span className="text-[10px] text-muted-foreground">{meal}</span>
                </div>
              ))}
            </div>
          )}

          {metric === "meals_per_day" && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-primary">3</span>
                <span className="text-xs text-muted-foreground">måltider idag</span>
              </div>
              {(dataConfig.rules || []).length > 0 && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  {dataConfig.rules[0]?.label || "Exempelstatus"}
                </p>
              )}
            </div>
          )}

          {metric === "regularity_30d" && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-primary">22</span>
                <span className="text-xs text-muted-foreground">/30 dagar med {dataConfig.threshold || 3}+ måltider</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
                <div className="bg-primary rounded-full h-1.5" style={{ width: "73%" }} />
              </div>
            </div>
          )}

          {dataSource === "symptom_log" && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">2 symptom senaste 7 dagarna</span>
            </div>
          )}

          {dataSource === "treatment_goals" && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">3/5 milstolpar avklarade</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
