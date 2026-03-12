import { Scale, Target, Sparkles } from "lucide-react";
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
  show: (section: string) => boolean;
}

const FOCUS_AREAS = [
  { name: 'Insulinkänslighet', description: 'Regelbundna måltider, lågglykemisk kost' },
  { name: 'Hormonbalans', description: 'Anti-inflammatorisk kost, omega-3' },
  { name: 'Vikthantering', description: 'Hållbar viktminskning vid behov' },
];

export function WomensHealthProgress({ data, show }: WomensHealthProgressProps) {
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
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-24">
      <ProgressHeader 
        title="Kvinnohälsa"
        subtitle="Hormonbalans & välmående"
        phase={data.treatmentPhase ? {
          name: data.treatmentPhase.name,
          current: data.treatmentPhase.currentPhase,
          total: data.treatmentPhase.totalPhases,
        } : undefined}
      />

      {show('metric_cards') && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Scale} label="Vikt" value={latestWeight?.toFixed(1) || '–'} unit="kg" trend={weightChange > 0 ? 'down' : weightChange < 0 ? 'up' : undefined} trendValue={weightChange !== 0 ? `${Math.abs(weightChange).toFixed(1)} kg` : undefined} status="neutral" />
          <MetricCard icon={Target} label="Midjemått" value={latestWaist?.toFixed(0) || '–'} unit="cm" subtitle="Mål: <80 cm" status={latestWaist ? (latestWaist < 80 ? 'success' : 'warning') : 'neutral'} />
        </div>
      )}

      {show('log_button') && (
        <div className="flex gap-2 justify-center">
          <LogMetricSheet metricType="weight" trigger={<Button variant="outline" size="sm" className="gap-2 rounded-full px-4 border-border/60 font-medium shadow-sm"><Plus className="w-3.5 h-3.5" />Logga vikt</Button>} />
          <LogMetricSheet metricType="waist_circumference" trigger={<Button variant="outline" size="sm" className="gap-2 rounded-full px-4 border-border/60 font-medium shadow-sm"><Plus className="w-3.5 h-3.5" />Logga midjemått</Button>} />
        </div>
      )}

      {show('trend_chart') && weightChartData.length > 0 && (
        <TrendChart title="Viktutveckling" data={weightChartData} unit="kg" />
      )}

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Fokusområden
        </h2>
        <div className="space-y-2.5">
          {FOCUS_AREAS.map((area) => (
            <Card key={area.name} className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{area.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{area.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Veckoöversikt
        </h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">Aktiva dagar</span>
                <span className="text-sm font-semibold">{data.weeklyStats.activeDays}/7</span>
              </div>
              <Progress value={(data.weeklyStats.activeDays / 7) * 100} className="h-2 rounded-full" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Loggade måltider</span>
                <span className="text-sm font-semibold">{data.weeklyStats.mealsLogged || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {show('treatment_plan') && <TreatmentPlanSection />}
      {show('milestones') && <MilestoneList milestones={data.milestones} />}

      <Card className="border-border/50 shadow-sm bg-gradient-to-br from-pink-50/40 to-background dark:from-pink-950/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Tips för hormonbalans</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
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
