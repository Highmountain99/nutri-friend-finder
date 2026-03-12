import { TrendingUp, Target, Flame, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { MetricCard } from "./shared/MetricCard";
import { MilestoneList } from "./shared/MilestoneList";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";
import { WeeklyOverview } from "./shared/WeeklyOverview";
import { LogMetricSheet } from "./shared/LogMetricSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GeneralHealthProgressProps {
  data: ProgressData;
  show: (section: string) => boolean;
}

export function GeneralHealthProgress({ data, show }: GeneralHealthProgressProps) {
  const weightEntries = data.healthEntries.filter(e => e.metric_type === 'weight');
  const latestWeight = weightEntries[0]?.value;

  const macroProgress = {
    protein: { current: 45, target: 60, unit: 'g' },
    carbs: { current: 180, target: 250, unit: 'g' },
    fat: { current: 50, target: 65, unit: 'g' },
  };

  return (
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-24">
      <ProgressHeader 
        title="Din utveckling"
        subtitle="Följ dina hälsoframsteg"
      />

      {show('metric_cards') && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Flame} label="Kalorier idag" value={data.weeklyStats.caloriesAvg || '–'} unit="kcal" subtitle={data.weeklyStats.caloriesGoal ? `Mål: ${data.weeklyStats.caloriesGoal}` : undefined} status="neutral" />
          <MetricCard icon={Target} label="Aktiva dagar" value={data.weeklyStats.activeDays} unit="/ 7" status={data.weeklyStats.activeDays >= 5 ? 'success' : 'neutral'} />
        </div>
      )}

      {show('log_button') && latestWeight && (
        <div className="flex justify-center">
          <LogMetricSheet metricType="weight" trigger={
            <Button variant="outline" size="sm" className="gap-2 rounded-full px-5 border-border/60 font-medium shadow-sm">
              <Plus className="w-4 h-4" />Logga vikt ({latestWeight.toFixed(1)} kg)
            </Button>
          } />
        </div>
      )}

      {show('macro_progress') && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Makros idag</h2>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-4">
              {[
                { label: 'Protein', icon: Dumbbell, color: 'text-primary', data: macroProgress.protein },
                { label: 'Kolhydrater', icon: TrendingUp, color: 'text-amber-500', data: macroProgress.carbs },
                { label: 'Fett', icon: Flame, color: 'text-destructive/70', data: macroProgress.fat },
              ].map(({ label, icon: Icon, color, data: d }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-sm font-medium">{label}</span></div>
                    <span className="text-sm text-muted-foreground font-medium">{d.current}/{d.target}{d.unit}</span>
                  </div>
                  <Progress value={(d.current / d.target) * 100} className="h-2 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {show('weekly_overview') && <WeeklyOverview stats={data.weeklyStats} showCalories={true} />}
      {show('treatment_plan') && <TreatmentPlanSection />}
      {show('milestones') && <MilestoneList milestones={data.milestones} />}
    </div>
  );
}
