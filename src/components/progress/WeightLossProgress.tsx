import { Scale, Target, TrendingDown, Flame } from "lucide-react";
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
  
  // Target weight (could be fetched from goals in future)
  const targetWeight = firstWeight ? firstWeight * 0.9 : undefined; // 10% reduction as example
  const remainingWeight = latestWeight && targetWeight ? latestWeight - targetWeight : undefined;

  const chartData = weightEntries
    .map(e => ({ date: e.entry_date, value: Number(e.value) }))
    .reverse();

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <ProgressHeader 
        title="Din viktresa"
        subtitle="Följ dina framsteg vecka för vecka"
        phase={data.treatmentPhase ? {
          name: data.treatmentPhase.name,
          current: data.treatmentPhase.currentPhase,
          total: data.treatmentPhase.totalPhases,
        } : undefined}
      />

      {/* Weight Stats */}
      {show('metric_cards') && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Scale} label="Nu" value={latestWeight?.toFixed(1) || '–'} unit="kg" status="neutral" />
          <MetricCard icon={TrendingDown} label="Tappat" value={weightLost > 0 ? weightLost.toFixed(1) : '0'} unit="kg" status={weightLost > 0 ? 'success' : 'neutral'} trend={weightLost > 0 ? 'down' : undefined} />
          {firstWeight && <MetricCard icon={Target} label="Startvikt" value={firstWeight.toFixed(1)} unit="kg" status="neutral" />}
          {remainingWeight !== undefined && remainingWeight > 0 && <MetricCard icon={Target} label="Kvar till mål" value={remainingWeight.toFixed(1)} unit="kg" status="neutral" />}
        </div>
      )}

      {/* Log Weight Button */}
      {show('log_button') && (
        <div className="flex justify-center">
          <LogMetricSheet metricType="weight" trigger={<Button variant="outline" className="gap-2"><Plus className="w-4 h-4" />Logga vikt</Button>} />
        </div>
      )}

      {/* Weight Trend Chart */}
      {show('trend_chart') && (
        <TrendChart title="Viktutveckling" data={chartData} unit="kg" targetValue={targetWeight} targetLabel={targetWeight ? `Mål: ${targetWeight.toFixed(0)} kg` : undefined} />
      )}

      {/* Weekly Overview */}
      {show('weekly_overview') && <WeeklyOverview stats={data.weeklyStats} showCalories={true} />}

      {/* Treatment Plan from Dietitian */}
      {show('treatment_plan') && <TreatmentPlanSection />}

      {/* Milestones */}
      {show('milestones') && <MilestoneList milestones={data.milestones} />}
    </div>
  );
}
