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

const HEALTH_METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  weight: { label: "Vikt", unit: "kg" },
  waist: { label: "Midjemått", unit: "cm" },
  blood_pressure_systolic: { label: "Blodtryck (syst)", unit: "mmHg" },
  blood_pressure_diastolic: { label: "Blodtryck (diast)", unit: "mmHg" },
  bmi: { label: "BMI", unit: "" },
};

const SAMPLE_CHART_DATA: Record<string, { date: string; value: number }[]> = {
  weight: [
    { date: "Jan", value: 92 }, { date: "Feb", value: 90.5 }, { date: "Mar", value: 89 },
    { date: "Apr", value: 88.2 }, { date: "Maj", value: 87 }, { date: "Jun", value: 86.5 },
  ],
  waist: [
    { date: "Jan", value: 98 }, { date: "Feb", value: 97 }, { date: "Mar", value: 95 },
    { date: "Apr", value: 94.5 }, { date: "Maj", value: 93 }, { date: "Jun", value: 92 },
  ],
  blood_pressure_systolic: [
    { date: "Jan", value: 145 }, { date: "Feb", value: 140 }, { date: "Mar", value: 138 },
    { date: "Apr", value: 135 }, { date: "Maj", value: 132 }, { date: "Jun", value: 130 },
  ],
  blood_pressure_diastolic: [
    { date: "Jan", value: 95 }, { date: "Feb", value: 92 }, { date: "Mar", value: 90 },
    { date: "Apr", value: 88 }, { date: "Maj", value: 86 }, { date: "Jun", value: 85 },
  ],
  bmi: [
    { date: "Jan", value: 30.1 }, { date: "Feb", value: 29.6 }, { date: "Mar", value: 29.1 },
    { date: "Apr", value: 28.8 }, { date: "Maj", value: 28.5 }, { date: "Jun", value: 28.3 },
  ],
};

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

          {/* Trend chart */}
          {metric === "trend_chart" && (
            <div className="mt-2.5">
              {(() => {
                const hm = dataConfig.health_metric || "weight";
                const metricInfo = HEALTH_METRIC_LABELS[hm] || { label: "Vikt", unit: "kg" };
                const chartData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
                const first = chartData[0]?.value || 0;
                const last = chartData[chartData.length - 1]?.value || 0;
                const diff = last - first;
                const isDown = diff < 0;
                return (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{metricInfo.label}</span>
                      <div className="flex items-center gap-1">
                        {isDown ? (
                          <TrendingDown className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingUp className="h-3 w-3 text-amber-500" />
                        )}
                        <span className={`text-xs font-medium ${isDown ? "text-emerald-600" : "text-amber-600"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)} {metricInfo.unit}
                        </span>
                      </div>
                    </div>
                    <div className="h-[80px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                          <Tooltip
                            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                            formatter={(v: number) => [`${v} ${metricInfo.unit}`, metricInfo.label]}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Latest value */}
          {metric === "latest_value" && (
            <div className="mt-2.5">
              {(() => {
                const hm = dataConfig.health_metric || "weight";
                const metricInfo = HEALTH_METRIC_LABELS[hm] || { label: "Vikt", unit: "kg" };
                const sampleData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
                const latest = sampleData[sampleData.length - 1]?.value || 0;
                return (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-primary">{latest}</span>
                    <span className="text-xs text-muted-foreground">{metricInfo.unit} ({metricInfo.label})</span>
                  </div>
                );
              })()}
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
