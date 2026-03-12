import { Heart, Activity, Target, Fish, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { MetricCard } from "./shared/MetricCard";
import { TrendChart } from "./shared/TrendChart";
import { LogMetricSheet } from "./shared/LogMetricSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";

interface HeartHealthProgressProps {
  data: ProgressData;
  show: (section: string) => boolean;
}

// Mediterranean diet scoring (simplified)
const HEART_HEALTHY_CHOICES = [
  { name: 'Fet fisk', target: 2, current: 4, unit: 'portioner' },
  { name: 'Grönsaker', target: 14, current: 12, unit: 'portioner' },
  { name: 'Baljväxter', target: 3, current: 3, unit: 'portioner' },
  { name: 'Fullkorn', target: 7, current: 5, unit: 'portioner' },
];

export function HeartHealthProgress({ data, show }: HeartHealthProgressProps) {
  const cholesterolEntries = data.healthEntries.filter(e => e.metric_type === 'cholesterol_total');
  const systolicEntries = data.healthEntries.filter(e => e.metric_type === 'blood_pressure_systolic');
  const diastolicEntries = data.healthEntries.filter(e => e.metric_type === 'blood_pressure_diastolic');

  const latestCholesterol = cholesterolEntries[0]?.value;
  const latestSystolic = systolicEntries[0]?.value;
  const latestDiastolic = diastolicEntries[0]?.value;

  // Targets
  const cholesterolTarget = 5.0;
  const systolicTarget = 130;

  const isCholesterolOk = latestCholesterol && latestCholesterol < cholesterolTarget;
  const isBPOk = latestSystolic && latestSystolic < systolicTarget;

  // Mediterranean score (simplified calculation)
  const totalScore = HEART_HEALTHY_CHOICES.reduce((sum, item) => {
    return sum + Math.min((item.current / item.target) * 25, 25);
  }, 0);

  const cholesterolChartData = cholesterolEntries
    .map(e => ({ date: e.entry_date, value: Number(e.value) }))
    .reverse();

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <ProgressHeader 
        title="Hjärthälsa"
        subtitle="Följ dina värden och kostval"
      />

      {/* Key Metrics */}
      {show('metric_cards') && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Activity} label="Kolesterol" value={latestCholesterol?.toFixed(1) || '–'} unit="mmol/L" subtitle={`Mål: <${cholesterolTarget}`} status={latestCholesterol ? (isCholesterolOk ? 'success' : 'warning') : 'neutral'} />
          <MetricCard icon={Heart} label="Blodtryck" value={latestSystolic && latestDiastolic ? `${latestSystolic}/${latestDiastolic}` : '–'} unit="mmHg" subtitle={`Mål: <${systolicTarget}`} status={latestSystolic ? (isBPOk ? 'success' : 'warning') : 'neutral'} />
        </div>
      )}

      {/* Log Buttons */}
      {show('log_button') && (
        <div className="flex gap-2 justify-center flex-wrap">
          <LogMetricSheet metricType="cholesterol_total" trigger={<Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" />Kolesterol</Button>} />
          <LogMetricSheet metricType="blood_pressure_systolic" trigger={<Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" />Blodtryck</Button>} />
        </div>
      )}

      {/* Mediterranean Score */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          🥗 Medelhavspoäng
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Denna vecka</span>
              <span className="font-bold text-foreground">{Math.round(totalScore)}/100</span>
            </div>
            <Progress value={totalScore} className="h-2 mb-3" />
            <p className="text-xs text-muted-foreground">
              ↑ +5 jämfört med förra veckan
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Cholesterol Trend */}
      {cholesterolChartData.length > 0 && (
        <TrendChart
          title="Kolesteroltrend (6 mån)"
          data={cholesterolChartData}
          unit="mmol/L"
          targetValue={cholesterolTarget}
          targetLabel={`Mål: <${cholesterolTarget}`}
        />
      )}

      {/* Heart-Healthy Choices */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          ✅ Hjärtvänliga val denna vecka
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-4">
            {HEART_HEALTHY_CHOICES.map((item) => {
              const percentage = Math.min((item.current / item.target) * 100, 100);
              const isComplete = item.current >= item.target;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {item.name === 'Fet fisk' && <Fish className="w-4 h-4 text-primary" />}
                      {item.name === 'Grönsaker' && <Leaf className="w-4 h-4 text-primary" />}
                      {item.name !== 'Fet fisk' && item.name !== 'Grönsaker' && <Target className="w-4 h-4 text-primary" />}
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className={`text-sm ${isComplete ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {item.current}/{item.target} {item.unit}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Treatment Plan from Dietitian */}
      <TreatmentPlanSection />

      {/* Tips */}
      <Card className="shadow-soft bg-gradient-to-r from-red-50/50 to-background dark:from-red-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Tips för bättre hjärthälsa</p>
              <p className="text-xs text-muted-foreground">
                Ersätt rött kött med fisk 2 gånger i veckan. Olivolja istället för smör. 
                30 min promenad dagligen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
