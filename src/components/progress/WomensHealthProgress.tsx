import { Scale, Activity, Target, Sparkles } from "lucide-react";
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

interface WomensHealthProgressProps {
  data: ProgressData;
}

// Focus areas for women's health (PCOS focus)
const FOCUS_AREAS = [
  { name: 'Insulinkänslighet', description: 'Regelbundna måltider, lågglykemisk kost' },
  { name: 'Hormonbalans', description: 'Anti-inflammatorisk kost, omega-3' },
  { name: 'Vikthantering', description: 'Hållbar viktminskning vid behov' },
];

export function WomensHealthProgress({ data }: WomensHealthProgressProps) {
  const weightEntries = data.healthEntries.filter(e => e.metric_type === 'weight');
  const waistEntries = data.healthEntries.filter(e => e.metric_type === 'waist_circumference');

  const latestWeight = weightEntries[0]?.value;
  const latestWaist = waistEntries[0]?.value;
  const firstWeight = weightEntries[weightEntries.length - 1]?.value;
  const weightChange = firstWeight && latestWeight ? firstWeight - latestWeight : 0;

  const weightChartData = weightEntries
    .map(e => ({ date: e.entry_date, value: Number(e.value) }))
    .reverse();

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <ProgressHeader 
        title="Kvinnohälsa"
        subtitle="Hormonbalans & välmående"
        phase={data.treatmentPhase ? {
          name: data.treatmentPhase.name,
          current: data.treatmentPhase.currentPhase,
          total: data.treatmentPhase.totalPhases,
        } : undefined}
      />

      {/* Key Metrics */}
      {show('metric_cards') && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Scale} label="Vikt" value={latestWeight?.toFixed(1) || '–'} unit="kg" trend={weightChange > 0 ? 'down' : weightChange < 0 ? 'up' : undefined} trendValue={weightChange !== 0 ? `${Math.abs(weightChange).toFixed(1)} kg` : undefined} status="neutral" />
          <MetricCard icon={Target} label="Midjemått" value={latestWaist?.toFixed(0) || '–'} unit="cm" subtitle="Mål: <80 cm" status={latestWaist ? (latestWaist < 80 ? 'success' : 'warning') : 'neutral'} />
        </div>
      )}

      {/* Log Buttons */}
      {show('log_button') && (
        <div className="flex gap-2 justify-center">
          <LogMetricSheet metricType="weight" trigger={<Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" />Logga vikt</Button>} />
          <LogMetricSheet metricType="waist_circumference" trigger={<Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" />Logga midjemått</Button>} />
        </div>
      )}

      {/* Weight Trend */}
      {show('trend_chart') && weightChartData.length > 0 && (
        <TrendChart title="Viktutveckling" data={weightChartData} unit="kg" />
      )}

      {/* Focus Areas */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Fokusområden
        </h2>
        <div className="space-y-3">
          {FOCUS_AREAS.map((area) => (
            <Card key={area.name} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{area.name}</h3>
                    <p className="text-sm text-muted-foreground">{area.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Weekly Stats */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Veckoöversikt
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Aktiva dagar</span>
                <span className="text-sm font-medium">{data.weeklyStats.activeDays}/7</span>
              </div>
              <Progress value={(data.weeklyStats.activeDays / 7) * 100} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Loggade måltider</span>
                <span className="text-sm font-medium">{data.weeklyStats.mealsLogged || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Treatment Plan from Dietitian */}
      <TreatmentPlanSection />

      {/* Milestones */}
      <MilestoneList milestones={data.milestones} />

      {/* PCOS Tips */}
      <Card className="shadow-soft bg-gradient-to-r from-pink-50/50 to-background dark:from-pink-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Tips för hormonbalans</p>
              <p className="text-xs text-muted-foreground">
                Ät regelbundet (var 3-4:e timme), välj fullkorn och grönsaker, 
                begränsa socker och bearbetad mat. Motion förbättrar insulinkänsligheten.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
