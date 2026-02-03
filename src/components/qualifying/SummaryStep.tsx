import { StepLayout } from './StepLayout';
import { TriageResultCard } from './TriageResultCard';
import { Check, RotateCcw } from 'lucide-react';
import { TriageResult, TriageReasonCode } from '@/types/intake';
import { Button } from '@/components/ui/button';

interface SummaryStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onRestartWithDietist?: () => void;
  isLoading?: boolean;
  triageResult?: TriageResult;
  triageReasonCode?: TriageReasonCode;
}

const dietistBenefits = [
  'Regelbundna besök, 0 kr i patientavgift',
  'Obegränsad meddelandekontakt med din dietist',
  'Konkreta råd, coachning och rekommendationer',
];

const coachBenefits = [
  'Personlig kostrådgivning anpassad för dig',
  'Flexibel kontakt och uppföljning',
  'Praktiska verktyg för vardagliga kostval',
];

export function SummaryStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onRestartWithDietist,
  isLoading = false,
  triageResult = 'dietist',
  triageReasonCode = 'SAFE_COACH',
}: SummaryStepProps) {
  const isDietist = triageResult === 'dietist';
  const benefits = isDietist ? dietistBenefits : coachBenefits;
  const title = isDietist 
    ? 'Vi har en plan för dig'
    : 'Din kostrådgivare väntar';
  const description = isDietist
    ? 'Dina mål är närmare än du tror, och du behöver inte nå dem ensam. Våra dietister tar fram individanpassade kost- och nutritionsplaner som leder till varaktig förändring.'
    : 'En kostrådgivare hjälper dig att hitta hållbara vanor och praktiska lösningar för din vardag. Tillsammans skapar ni en plan som passar just ditt liv.';

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={title}
      onBack={onBack}
      onNext={onNext}
      nextLabel="Fortsätt"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Triage Result Card */}
        <TriageResultCard 
          result={triageResult} 
          reasonCode={triageReasonCode}
        />

        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>

        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-foreground">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Value illustration placeholder */}
        <div className="bg-primary-soft rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isDietist 
              ? 'Din personliga dietist väntar på dig'
              : 'Din kostrådgivare är redo att hjälpa dig'
            }
          </p>
        </div>

        {/* Switch to dietist option - only shown for coach result */}
        {!isDietist && onRestartWithDietist && (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              Tror du att du är i behov av att träffa en dietist? Vi kan ha tagit fel.
            </p>
            <Button
              variant="outline"
              onClick={onRestartWithDietist}
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Börja om med dietist-spår
            </Button>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
