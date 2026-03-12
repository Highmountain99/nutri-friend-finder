import { Activity, Droplets, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { MetricCard } from "./shared/MetricCard";
import { TrendChart } from "./shared/TrendChart";
import { MilestoneList } from "./shared/MilestoneList";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";
import { LogMetricSheet } from "./shared/LogMetricSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DiabetesProgressProps {
  data: ProgressData;
  show: (section: string) => boolean;
}

export function DiabetesProgress({ data, show }: DiabetesProgressProps) {
  const fastingEntries = data.healthEntries.filter(e => e.metric_type === 'blood_sugar_fasting');
  const postMealEntries = data.healthEntries.filter(e => e.metric_type === 'blood_sugar_post_meal');
  const hba1cEntries = data.healthEntries.filter(e => e.metric_type === 'hba1c');

  const latestFasting = fastingEntries[0]?.value;
  const latestPostMeal = postMealEntries[0]?.value;
  const latestHba1c = hba1cEntries[0]?.value;

  const fastingTarget = { min: 4, max: 7 };
  const postMealTarget = { min: 4, max: 10 };
  const hba1cTarget = 7;

  const isFastingInRange = latestFasting && latestFasting >= fastingTarget.min && latestFasting <= fastingTarget.max;
  const isPostMealInRange = latestPostMeal && latestPostMeal >= postMealTarget.min && latestPostMeal <= postMealTarget.max;

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
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-24">
      <ProgressHeader 
        title="Blodsockerkontroll"
        subtitle={latestHba1c ? `Senaste HbA1c: ${latestHba1c}% | Mål: <${hba1cTarget}%` : 'Övervaka ditt blodsocker'}
      />

      {show('metric_cards') && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Droplets} label="Fastesocker" value={latestFasting?.toFixed(1) || '–'} unit="mmol/L" subtitle={isFastingInRange ? '✓ I mål' : latestFasting ? '⚠ Utanför mål' : undefined} status={latestFasting ? (isFastingInRange ? 'success' : 'warning') : 'neutral'} />
          <MetricCard icon={Activity} label="Efter mat" value={latestPostMeal?.toFixed(1) || '–'} unit="mmol/L" subtitle={isPostMealInRange ? '✓ I mål' : latestPostMeal ? '⚠ Utanför mål' : undefined} status={latestPostMeal ? (isPostMealInRange ? 'success' : 'warning') : 'neutral'} />
        </div>
      )}

      {show('log_button') && (
        <div className="flex flex-wrap gap-2 justify-center">
          <LogMetricSheet metricType="blood_sugar_fasting" trigger={<Button variant="outline" size="sm" className="gap-2 rounded-full px-4 border-border/60 font-medium shadow-sm"><Plus className="w-3.5 h-3.5" />Faste</Button>} />
          <LogMetricSheet metricType="blood_sugar_post_meal" trigger={<Button variant="outline" size="sm" className="gap-2 rounded-full px-4 border-border/60 font-medium shadow-sm"><Plus className="w-3.5 h-3.5" />Efter mat</Button>} />
          <LogMetricSheet metricType="hba1c" trigger={<Button variant="outline" size="sm" className="gap-2 rounded-full px-4 border-border/60 font-medium shadow-sm"><Plus className="w-3.5 h-3.5" />HbA1c</Button>} />
        </div>
      )}

      {show('trend_chart') && (
        <TrendChart title="Blodsocker senaste 7 dagar" data={bloodSugarChartData} unit="mmol/L" targetValue={7} targetLabel="Mål: 4-10" minValue={3} maxValue={15} />
      )}

      {show('metric_cards') && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Tid i målintervall</h2>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm text-muted-foreground">4-10 mmol/L</span>
                <span className="font-bold text-foreground text-lg">{timeInRange}%</span>
              </div>
              <Progress value={timeInRange} className="h-2.5 rounded-full" />
              <p className="text-xs text-muted-foreground mt-2.5">Baserat på {allBloodSugarEntries.length} mätningar</p>
            </CardContent>
          </Card>
        </section>
      )}

      {show('macro_progress') && data.weeklyStats.caloriesAvg !== undefined && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Kolhydratintag idag</h2>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <div className="flex-1"><Progress value={80} className="h-2.5 rounded-full" /></div>
                <span className="text-sm font-semibold">145g / 180g</span>
              </div>
              <p className="text-xs text-muted-foreground">Håll kolhydraterna jämna över dagen</p>
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Fokusområden</h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Target className="w-4 h-4 text-primary" /></div><span className="font-medium">Håll kolhydraterna jämna över dagen</span></div>
            <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-primary" /></div><span className="font-medium">Logga blodsocker efter måltid</span></div>
          </CardContent>
        </Card>
      </section>

      {show('treatment_plan') && <TreatmentPlanSection />}
      {show('milestones') && <MilestoneList milestones={data.milestones} />}
    </div>
  );
}
