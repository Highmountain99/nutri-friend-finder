import { StepLayout } from './StepLayout';
import { Check } from 'lucide-react';

interface SummaryStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const benefits = [
  'Regelbundna besök, 0 kr i patientavgift',
  'Obegränsad meddelandekontakt med din dietist',
  'Konkreta råd, coachning och rekommendationer',
];

export function SummaryStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isLoading = false,
}: SummaryStepProps) {
  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Vi har en plan för dig"
      onBack={onBack}
      onNext={onNext}
      nextLabel="Fortsätt"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Dina mål är närmare än du tror, och du behöver inte nå dem ensam. 
          Våra dietister tar fram individanpassade kost- och nutritionsplaner 
          som leder till varaktig förändring.
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
            Din personliga dietist väntar på dig
          </p>
        </div>
      </div>
    </StepLayout>
  );
}
