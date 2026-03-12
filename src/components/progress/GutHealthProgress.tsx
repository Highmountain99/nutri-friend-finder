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

// FODMAP phases with foods to test
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
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <ProgressHeader 
        title="FODMAP-resan"
        subtitle={`Fas ${currentPhase}: ${FODMAP_PHASES[currentPhase - 1]?.name}`}
        phase={{
          name: FODMAP_PHASES[currentPhase - 1]?.name || 'Pågående',
          current: currentPhase,
          total: 3,
        }}
      />

      {/* Phase Overview */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FODMAP_PHASES.map((phase, index) => (
          <Badge
            key={phase.name}
            variant={index + 1 === currentPhase ? 'default' : index + 1 < currentPhase ? 'secondary' : 'outline'}
            className="whitespace-nowrap flex items-center gap-1"
          >
            {index + 1 < currentPhase && <Check className="w-3 h-3" />}
            {index + 1 === currentPhase && <Circle className="w-3 h-3 fill-current" />}
            {phase.name}
          </Badge>
        ))}
      </div>

      {/* Current Challenge */}
      {currentPhase === 2 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Aktuell utmaning
          </h2>
          <Card className="shadow-soft border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Testar: Laktos (mjölk)</h3>
                  <p className="text-sm text-muted-foreground">Dag 2 av 3</p>
                  <button className="text-sm text-primary font-medium mt-2 hover:underline">
                    Logga reaktion →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Identified Triggers */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Identifierade triggers
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-3">
            {FODMAP_GROUPS.map((group) => (
              <div key={group.name} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  group.status === 'trigger' 
                    ? 'bg-amber-100 text-amber-600' 
                    : group.status === 'safe'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-primary-soft text-primary'
                }`}>
                  {group.status === 'trigger' && <AlertCircle className="w-4 h-4" />}
                  {group.status === 'safe' && <Check className="w-4 h-4" />}
                  {group.status === 'testing' && <Circle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.foods}</p>
                </div>
                <Badge variant={
                  group.status === 'trigger' ? 'destructive' : 
                  group.status === 'safe' ? 'secondary' : 'default'
                } className="text-xs">
                  {group.status === 'trigger' ? 'Trigger' : group.status === 'safe' ? 'OK' : 'Testar'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Symptom-Free Days */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Symptomfria dagar
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{symptomFreeDays}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">av 7 dagar denna vecka</p>
                <p className="text-sm text-muted-foreground">
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

      {/* Treatment Plan from Dietitian */}
      <TreatmentPlanSection />

      {/* Next Steps */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Nästa steg
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Slutför laktostest (1 dag kvar)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Leaf className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Börja testa fruktan (bröd)</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
