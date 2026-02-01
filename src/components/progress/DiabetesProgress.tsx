import { Activity, Droplets, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { MetricCard } from "./shared/MetricCard";
import { TrendChart } from "./shared/TrendChart";
import { MilestoneList } from "./shared/MilestoneList";
import { LogMetricSheet } from "./shared/LogMetricSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DiabetesProgressProps {
  data: ProgressData;
}

export function DiabetesProgress({ data }: DiabetesProgressProps) {
  const fastingEntries = data.healthEntries.filter(e => e.metric_type === 'blood_sugar_fasting');
  const postMealEntries = data.healthEntries.filter(e => e.metric_type === 'blood_sugar_post_meal');
  const hba1cEntries = data.healthEntries.filter(e => e.metric_type === 'hba1c');

  const latestFasting = fastingEntries[0]?.value;
  const latestPostMeal = postMealEntries[0]?.value;
  const latestHba1c = hba1cEntries[0]?.value;

  // Target ranges
  const fastingTarget = { min: 4, max: 7 };
  const postMealTarget = { min: 4, max: 10 };
  const hba1cTarget = 7;

  const isFastingInRange = latestFasting && latestFasting >= fastingTarget.min && latestFasting <= fastingTarget.max;
  const isPostMealInRange = latestPostMeal && latestPostMeal >= postMealTarget.min && latestPostMeal <= postMealTarget.max;

  // Calculate time in range for the week
  const allBloodSugarEntries = [...fastingEntries, ...postMealEntries];
  const entriesInRange = allBloodSugarEntries.filter(e => {
    const val = Number(e.value);
    return val >= 4 && val <= 10;
  });
  const timeInRange = allBloodSugarEntries.length > 0 
    ? Math.round((entriesInRange.length / allBloodSugarEntries.length) * 100)
    : 0;

  const bloodSugarChartData = [...fastingEntries, ...postMealEntries]
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map(e => ({ date: e.entry_date, value: Number(e.value) }));

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <ProgressHeader 
        title="Blodsockerkontroll"
        subtitle={latestHba1c ? `Senaste HbA1c: ${latestHba1c}% | Mål: <${hba1cTarget}%` : 'Övervaka ditt blodsocker'}
      />

      {/* Current Readings */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Droplets}
          label="Fastesocker"
          value={latestFasting?.toFixed(1) || '–'}
          unit="mmol/L"
          subtitle={isFastingInRange ? '✓ I mål' : latestFasting ? '⚠ Utanför mål' : undefined}
          status={latestFasting ? (isFastingInRange ? 'success' : 'warning') : 'neutral'}
        />
        <MetricCard
          icon={Activity}
          label="Efter mat"
          value={latestPostMeal?.toFixed(1) || '–'}
          unit="mmol/L"
          subtitle={isPostMealInRange ? '✓ I mål' : latestPostMeal ? '⚠ Utanför mål' : undefined}
          status={latestPostMeal ? (isPostMealInRange ? 'success' : 'warning') : 'neutral'}
        />
      </div>

      {/* Log Buttons */}
      <div className="flex gap-2 justify-center">
        <LogMetricSheet 
          metricType="blood_sugar_fasting"
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Faste
            </Button>
          }
        />
        <LogMetricSheet 
          metricType="blood_sugar_post_meal"
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Efter mat
            </Button>
          }
        />
        <LogMetricSheet 
          metricType="hba1c"
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              HbA1c
            </Button>
          }
        />
      </div>

      {/* Blood Sugar Trend */}
      <TrendChart
        title="Blodsocker senaste 7 dagar"
        data={bloodSugarChartData}
        unit="mmol/L"
        targetValue={7}
        targetLabel="Mål: 4-10"
        minValue={3}
        maxValue={15}
      />

      {/* Time in Range */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Tid i målintervall
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">4-10 mmol/L</span>
              <span className="font-bold text-foreground">{timeInRange}%</span>
            </div>
            <Progress value={timeInRange} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Baserat på {allBloodSugarEntries.length} mätningar
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Carb Intake */}
      {data.weeklyStats.caloriesAvg !== undefined && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Kolhydratintag idag
          </h2>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <Progress value={80} className="h-2" />
                </div>
                <span className="text-sm font-medium">145g / 180g</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Håll kolhydraterna jämna över dagen
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Focus Areas */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Fokusområden
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-primary" />
              <span>Håll kolhydraterna jämna över dagen</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Logga blodsocker efter måltid</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Milestones */}
      <MilestoneList milestones={data.milestones} />
    </div>
  );
}
