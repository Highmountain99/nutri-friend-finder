import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Circle, Flame, TrendingUp, TrendingDown } from "lucide-react";
import * as Icons from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

interface BlockPreviewProps {
  title: string;
  description?: string;
  icon: string;
  dataSource: string;
  dataConfig: Record<string, any>;
  displayConfig?: Record<string, any>;
  blockType?: string;
}

function getIcon(iconName: string, className = "h-4 w-4") {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className={className} /> : <Icons.Square className={className} />;
}

const ROLE_LABELS: Record<string, string> = {
  action: "Action",
  insight: "Insikt",
  progress: "Progress",
  test: "Test",
  reflection: "Reflektion",
  follow_up: "Uppföljning",
};

export function BlockPreview({ title, description, icon, dataSource, dataConfig, displayConfig = {}, blockType = "action" }: BlockPreviewProps) {
  const sourceBadge = dataSource === "none"
    ? { label: "Din dietist", className: "bg-blue-50 text-blue-700 border-blue-200" }
    : { label: "Från journal", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };

  const metric = dataConfig.metric || "";
  const progression = dataConfig.progression || "none";
  const progressionTarget = dataConfig.progression_target || 7;
  const interpretation = dataConfig.interpretation || "summary";
  const tone = displayConfig.tone || "neutral";

  // Simulated data for preview
  const simulatedStreakDays = 4;
  const simulatedWeeklyDays = 3;
  const simulatedTimeLimitedDay = 2;

  return (
    <Card className="p-4 bg-card border border-border shadow-sm">
      {/* Top: icon + title + badges */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/8 text-primary shrink-0">
          {getIcon(icon, "h-5 w-5")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold truncate">{title || "Namnlöst block"}</h4>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${sourceBadge.className}`}>
              {sourceBadge.label}
            </Badge>
            {blockType && blockType !== "action" && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                {ROLE_LABELS[blockType] || blockType}
              </Badge>
            )}
          </div>

          {/* Manual block */}
          {dataSource === "none" && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
              {description || "Manuellt innehåll sätts per patient"}
            </p>
          )}

          {/* Meal rhythm checklist */}
          {metric === "meal_rhythm" && (
            <div className="flex flex-wrap gap-3 mt-2.5">
              {[
                { label: "Frukost", done: true },
                { label: "Lunch", done: true },
                { label: "Middag", done: false },
                { label: "Mellanmål", done: false },
              ].map((meal) => (
                <div key={meal.label} className="flex items-center gap-1.5">
                  {meal.done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                  )}
                  <span className={`text-xs ${meal.done ? "text-foreground" : "text-muted-foreground"}`}>{meal.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Meals per day */}
          {metric === "meals_per_day" && (
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-primary">3</span>
                <span className="text-xs text-muted-foreground">måltider idag</span>
              </div>
              {(dataConfig.rules || []).length > 0 && (
                <p className={`text-xs mt-1 ${tone === "encouraging" ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {dataConfig.rules[0]?.label || "Status baserat på regler"}
                </p>
              )}
            </div>
          )}

          {/* Regularity 30d */}
          {metric === "regularity_30d" && (
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-primary">22</span>
                <span className="text-xs text-muted-foreground">/ 30 dagar med {dataConfig.threshold || 3}+ måltider</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-primary rounded-full h-2 transition-all" style={{ width: "73%" }} />
              </div>
              {interpretation === "status" && (
                <p className="text-xs text-emerald-600 mt-1.5">✓ Stabil regelbundenhet</p>
              )}
            </div>
          )}

          {/* Symptom data */}
          {(metric === "symptom_count" || metric === "symptom_by_time" || metric === "symptom_after_meal") && (
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-primary">2</span>
                <span className="text-xs text-muted-foreground">
                  {metric === "symptom_after_meal" ? "symptom kopplade till måltid" : "symptom senaste 7 dagarna"}
                </span>
              </div>
              {interpretation === "trend" && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-600">Ökat jämfört med förra veckan</span>
                </div>
              )}
            </div>
          )}

          {/* Treatment goals */}
          {metric === "milestone_progress" && (
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-primary">3</span>
                <span className="text-xs text-muted-foreground">/ 5 milstolpar avklarade</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-primary rounded-full h-2" style={{ width: "60%" }} />
              </div>
            </div>
          )}

          {/* Macro data */}
          {metric === "macro_value" && (
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-primary">68g</span>
                <span className="text-xs text-muted-foreground">protein idag</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progression section */}
      {progression !== "none" && (
        <div className="mt-3 pt-3 border-t border-border/50">
          {progression === "streak" && (
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium">{simulatedStreakDays} dagar i rad</span>
              <span className="text-[10px] text-muted-foreground">/ {progressionTarget}</span>
              <div className="flex gap-0.5 ml-auto">
                {Array.from({ length: progressionTarget }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i < simulatedStreakDays ? "bg-orange-400" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {progression === "weekly_goal" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{simulatedWeeklyDays} / {progressionTarget} dagar denna vecka</span>
              <div className="flex gap-0.5 ml-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i < simulatedWeeklyDays ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {progression === "daily_check" && (
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Avklarat idag</span>
            </div>
          )}

          {progression === "time_limited" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Dag {simulatedTimeLimitedDay} av {progressionTarget}</span>
                <span className="text-[10px] text-muted-foreground">{Math.round((simulatedTimeLimitedDay / progressionTarget) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${(simulatedTimeLimitedDay / progressionTarget) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
