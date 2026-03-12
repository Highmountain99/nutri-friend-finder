import { AlertCircle, Check, Circle, Leaf, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";

interface GutHealthProgressProps {
  data: ProgressData;
  show: (section: string) => boolean;
}

const FODMAP_PHASES = [
  { name: 'Eliminering', duration: '2-6 veckor' },
  { name: 'Återintroduktion', duration: '6-8 veckor' },
  { name: 'Personalisering', duration: 'Pågående' },
];

const FODMAP_GROUPS = [
  { name: 'Laktos', foods: 'Mjölk, glass, yoghurt', status: 'testing' as const },
  { name: 'Fruktos', foods: 'Äpple, mango, honung', status: 'trigger' as const },
  { name: 'Oligosackarider', foods: 'Lök, vitlök, vete', status: 'trigger' as const },
  { name: 'Polyoler', foods: 'Svamp, blomkål, sötningsmedel', status: 'safe' as const },
];

export function GutHealthProgress({ data, show }: GutHealthProgressProps) {
  const currentPhase = data.treatmentPhase?.currentPhase || 1;
  const symptomFreeDays = data.weeklyStats.symptomFreeDays || 0;

  return (
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-24">
      <ProgressHeader 
        title="FODMAP-resan"
        subtitle={`Fas ${currentPhase}: ${FODMAP_PHASES[currentPhase - 1]?.name}`}
        phase={{
          name: FODMAP_PHASES[currentPhase - 1]?.name || 'Pågående',
          current: currentPhase,
          total: 3,
        }}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FODMAP_PHASES.map((phase, index) => (
          <Badge
            key={phase.name}
            variant={index + 1 === currentPhase ? 'default' : index + 1 < currentPhase ? 'secondary' : 'outline'}
            className="whitespace-nowrap flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
          >
            {index + 1 < currentPhase && <Check className="w-3 h-3" />}
            {index + 1 === currentPhase && <Circle className="w-3 h-3 fill-current" />}
            {phase.name}
          </Badge>
        ))}
      </div>

      {currentPhase === 2 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Aktuell utmaning
          </h2>
          <Card className="border-border/50 shadow-sm border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Testar: Laktos (mjölk)</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Dag 2 av 3</p>
                  <button className="text-sm text-primary font-semibold mt-2 hover:underline">
                    Logga reaktion →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Identifierade triggers
        </h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 space-y-3.5">
            {FODMAP_GROUPS.map((group) => (
              <div key={group.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  group.status === 'trigger' 
                    ? 'bg-amber-500/10 text-amber-600' 
                    : group.status === 'safe'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-primary/10 text-primary'
                }`}>
                  {group.status === 'trigger' && <AlertCircle className="w-4 h-4" />}
                  {group.status === 'safe' && <Check className="w-4 h-4" />}
                  {group.status === 'testing' && <Circle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.foods}</p>
                </div>
                <Badge variant={
                  group.status === 'trigger' ? 'destructive' : 
                  group.status === 'safe' ? 'secondary' : 'default'
                } className="text-[10px] rounded-full px-2.5">
                  {group.status === 'trigger' ? 'Trigger' : group.status === 'safe' ? 'OK' : 'Testar'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Symptomfria dagar
        </h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{symptomFreeDays}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">av 7 dagar denna vecka</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {symptomFreeDays >= 5 
                    ? '↑ Bättre än förra veckan!' 
                    : 'Fortsätt följa protokollet'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {show('treatment_plan') && <TreatmentPlanSection />}

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Nästa steg
        </h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">Slutför laktostest (1 dag kvar)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Börja testa fruktan (bröd)</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
