import { Scale, Target, TrendingDown, Crosshair } from "lucide-react";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { MetricCard } from "./shared/MetricCard";
import { TrendChart } from "./shared/TrendChart";
import { MilestoneList } from "./shared/MilestoneList";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";
import { WeeklyOverview } from "./shared/WeeklyOverview";
import { LogMetricSheet } from "./shared/LogMetricSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WeightLossProgressProps {
  data: ProgressData;
  show: (section: string) => boolean;
}

export function WeightLossProgress({ data, show }: WeightLossProgressProps) {
  const weightEntries = data.healthEntries.filter(e => e.metric_type === 'weight');
  const latestWeight = weightEntries[0]?.value;
  const firstWeight = weightEntries[weightEntries.length - 1]?.value;
  const weightLost = firstWeight && latestWeight ? firstWeight - latestWeight : 0;
  
  const targetWeight = firstWeight ? firstWeight * 0.9 : undefined;
  const remainingWeight = latestWeight && targetWeight ? latestWeight - targetWeight : undefined;

  const chartData = weightEntries
    .map(e => ({ date: e.entry_date, value: Number(e.value) }))
    .reverse();

  return (
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-24">
      <ProgressHeader 
        title="Din viktresa"
        subtitle="Följ dina framsteg vecka för vecka"
        phase={data.treatmentPhase ? {
          name: data.treatmentPhase.name,
          current: data.treatmentPhase.currentPhase,
          total: data.treatmentPhase.totalPhases,
        } : undefined}
      />

      {show('metric_cards') && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Scale} label="Nu" value={latestWeight?.toFixed(1) || '–'} unit="kg" status="neutral" />
          <MetricCard icon={TrendingDown} label="Tappat" value={weightLost > 0 ? weightLost.toFixed(1) : '0'} unit="kg" status={weightLost > 0 ? 'success' : 'neutral'} trend={weightLost > 0 ? 'down' : undefined} />
          {firstWeight && <MetricCard icon={Crosshair} label="Startvikt" value={firstWeight.toFixed(1)} unit="kg" status="neutral" />}
          {remainingWeight !== undefined && remainingWeight > 0 && <MetricCard icon={Target} label="Kvar till mål" value={remainingWeight.toFixed(1)} unit="kg" status="neutral" />}
        </div>
      )}

      {show('log_button') && (
        <div className="flex justify-center">
          <LogMetricSheet metricType="weight" trigger={
            <Button variant="outline" className="gap-2 rounded-full px-6 h-11 border-border/60 font-medium shadow-sm">
              <Plus className="w-4 h-4" />Logga vikt
            </Button>
          } />
        </div>
      )}

      {show('trend_chart') && (
        <TrendChart title="Viktutveckling" data={chartData} unit="kg" targetValue={targetWeight} targetLabel={targetWeight ? `Mål: ${targetWeight.toFixed(0)} kg` : undefined} />
      )}

      {show('weekly_overview') && <WeeklyOverview stats={data.weeklyStats} showCalories={true} />}

      {show('treatment_plan') && <TreatmentPlanSection />}

      {show('milestones') && <MilestoneList milestones={data.milestones} />}
    </div>
  );
}
