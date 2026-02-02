import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { PregnancyTriageReason, pregnancyTriageReasonLabels } from '@/types/intake';
import { cn } from '@/lib/utils';
import { Baby } from 'lucide-react';

interface PregnancyTriageStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    pregnancyTriageReason: PregnancyTriageReason;
    pregnancyReferredByCare?: boolean;
  }) => void;
  onBack: () => void;
  initialReason?: PregnancyTriageReason;
  initialReferredByCare?: boolean;
}

// Reasons that require dietist directly
const MEDICAL_REASONS: PregnancyTriageReason[] = [
  'gdm_risk_or_dx',
  'diabetes',
  'nutrient_deficiency',
  'medical_complication',
  'unsure',
];

// Reasons that need follow-up question about care referral
const GENERAL_REASONS: PregnancyTriageReason[] = [
  'general_planning',
  'nausea_cravings',
  'weight_concern',
];

type Step = 'reason' | 'referral';

export function PregnancyTriageStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialReason,
  initialReferredByCare,
}: PregnancyTriageStepProps) {
  const [internalStep, setInternalStep] = useState<Step>(initialReason && GENERAL_REASONS.includes(initialReason) ? 'referral' : 'reason');
  const [selectedReason, setSelectedReason] = useState<PregnancyTriageReason | undefined>(initialReason);
  const [referredByCare, setReferredByCare] = useState<boolean | undefined>(initialReferredByCare);

  const handleReasonSelect = (reason: PregnancyTriageReason) => {
    setSelectedReason(reason);
  };

  const handleReasonNext = () => {
    if (!selectedReason) return;
    
    // Medical reasons go directly to dietist
    if (MEDICAL_REASONS.includes(selectedReason)) {
      onNext({ pregnancyTriageReason: selectedReason });
    } else {
      // General reasons need follow-up
      setInternalStep('referral');
    }
  };

  const handleReferralSelect = (referred: boolean) => {
    setReferredByCare(referred);
  };

  const handleReferralNext = () => {
    if (selectedReason === undefined) return;
    onNext({
      pregnancyTriageReason: selectedReason,
      pregnancyReferredByCare: referredByCare,
    });
  };

  const handleBack = () => {
    if (internalStep === 'referral') {
      setInternalStep('reason');
      setReferredByCare(undefined);
    } else {
      onBack();
    }
  };

  if (internalStep === 'referral') {
    return (
      <StepLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        title="Har vården bett dig kontakta dietist?"
        onBack={handleBack}
        onNext={handleReferralNext}
        nextDisabled={referredByCare === undefined}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-primary-soft rounded-xl mb-6">
            <Baby className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Har barnmorska eller läkare rekommenderat att du kontaktar en dietist?
            </p>
          </div>

          {[
            { value: true, label: 'Ja' },
            { value: false, label: 'Nej' },
            { value: undefined, label: 'Osäker', isUnsure: true },
          ].map((option) => (
            <button
              key={String(option.value)}
              onClick={() => handleReferralSelect(option.isUnsure ? true : option.value as boolean)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                referredByCare === option.value || (option.isUnsure && referredByCare === true)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                referredByCare === option.value || (option.isUnsure && referredByCare === true)
                  ? "border-primary"
                  : "border-muted-foreground/30"
              )}>
                {(referredByCare === option.value || (option.isUnsure && referredByCare === true)) && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Vad vill du ha hjälp med under graviditeten?"
      onBack={handleBack}
      onNext={handleReasonNext}
      nextDisabled={!selectedReason}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-primary-soft rounded-xl mb-6">
          <Baby className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Välj det alternativ som bäst beskriver ditt behov.
          </p>
        </div>

        {(Object.keys(pregnancyTriageReasonLabels) as PregnancyTriageReason[]).map((reason) => (
          <button
            key={reason}
            onClick={() => handleReasonSelect(reason)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
              selectedReason === reason
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
              selectedReason === reason
                ? "border-primary"
                : "border-muted-foreground/30"
            )}>
              {selectedReason === reason && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="font-medium text-sm">{pregnancyTriageReasonLabels[reason]}</span>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
