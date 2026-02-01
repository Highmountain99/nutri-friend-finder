import { TrendingUp, Target, Flame, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { MetricCard } from "./shared/MetricCard";
import { MilestoneList } from "./shared/MilestoneList";
import { WeeklyOverview } from "./shared/WeeklyOverview";
import { LogMetricSheet } from "./shared/LogMetricSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GeneralHealthProgressProps {
  data: ProgressData;
}

export function GeneralHealthProgress({ data }: GeneralHealthProgressProps) {
  const weightEntries = data.healthEntries.filter(e => e.metric_type === 'weight');
  const latestWeight = weightEntries[0]?.value;

  // Mock macro targets (would come from nutrition goals in real implementation)
  const macroProgress = {
    protein: { current: 45, target: 60, unit: 'g' },
    carbs: { current: 180, target: 250, unit: 'g' },
    fat: { current: 50, target: 65, unit: 'g' },
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <ProgressHeader 
        title="Din utveckling"
        subtitle="Följ dina hälsoframsteg"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Flame}
          label="Kalorier idag"
          value={data.weeklyStats.caloriesAvg || '–'}
          unit="kcal"
          subtitle={data.weeklyStats.caloriesGoal ? `Mål: ${data.weeklyStats.caloriesGoal}` : undefined}
          status="neutral"
        />
        <MetricCard
          icon={Target}
          label="Aktiva dagar"
          value={data.weeklyStats.activeDays}
          unit="/ 7"
          status={data.weeklyStats.activeDays >= 5 ? 'success' : 'neutral'}
        />
      </div>

      {/* Log Weight (if relevant) */}
      {latestWeight && (
        <div className="flex justify-center">
          <LogMetricSheet 
            metricType="weight"
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Logga vikt ({latestWeight.toFixed(1)} kg)
              </Button>
            }
          />
        </div>
      )}

      {/* Macro Progress */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Makros idag
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Protein</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {macroProgress.protein.current}/{macroProgress.protein.target}{macroProgress.protein.unit}
                </span>
              </div>
              <Progress 
                value={(macroProgress.protein.current / macroProgress.protein.target) * 100} 
                className="h-2" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Kolhydrater</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {macroProgress.carbs.current}/{macroProgress.carbs.target}{macroProgress.carbs.unit}
                </span>
              </div>
              <Progress 
                value={(macroProgress.carbs.current / macroProgress.carbs.target) * 100} 
                className="h-2" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Fett</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {macroProgress.fat.current}/{macroProgress.fat.target}{macroProgress.fat.unit}
                </span>
              </div>
              <Progress 
                value={(macroProgress.fat.current / macroProgress.fat.target) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Weekly Overview */}
      <WeeklyOverview stats={data.weeklyStats} showCalories={true} />

      {/* Milestones */}
      <MilestoneList milestones={data.milestones} />
    </div>
  );
}
