// Note: This component is no longer used in the simplified flow.
// Kept for potential future use.

import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { screeningOptions, noneOfTheAboveOption } from '@/data/screeningQuestions';
import { RedFlagSymptom } from '@/types/intake';
import { cn } from '@/lib/utils';
import { Check, Info } from 'lucide-react';

interface ScreeningStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    redFlagSymptoms: RedFlagSymptom[];
    showPregnancyTriage: boolean;
  }) => void;
  onBack: () => void;
  initialSymptoms?: RedFlagSymptom[];
}

export function ScreeningStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialSymptoms = [],
}: ScreeningStepProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<RedFlagSymptom[]>(initialSymptoms);
  const [noneSelected, setNoneSelected] = useState(false);

  const handleSymptomToggle = (symptom: RedFlagSymptom) => {
    setNoneSelected(false);
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom);
      } else {
        return [...prev, symptom];
      }
    });
  };

  const handleNoneToggle = () => {
    setNoneSelected(true);
    setSelectedSymptoms([]);
  };

  const handleNext = () => {
    const showPregnancyTriage = selectedSymptoms.includes('pregnancy');
    onNext({
      redFlagSymptoms: selectedSymptoms,
      showPregnancyTriage,
    });
  };

  const isNextDisabled = selectedSymptoms.length === 0 && !noneSelected;

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Berätta lite om din situation"
      subtitle="Denna information hjälper oss rekommendera rätt typ av stöd för dig."
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={isNextDisabled}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 bg-primary-soft rounded-xl mb-6">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Denna information hjälper oss ge dig bästa möjliga rekommendation.
          </p>
        </div>

        {screeningOptions.map((option) => {
          const isSelected = selectedSymptoms.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => handleSymptomToggle(option.value)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/30"
              )}>
                {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">{option.label}</span>
                {option.description && (
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                )}
              </div>
            </button>
          );
        })}

        <button
          onClick={handleNoneToggle}
          className={cn(
            "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
            noneSelected
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            noneSelected
              ? "bg-primary border-primary"
              : "border-muted-foreground/30"
          )}>
            {noneSelected && <Check className="w-4 h-4 text-primary-foreground" />}
          </div>
          <span className="font-medium text-foreground">{noneOfTheAboveOption.label}</span>
        </button>
      </div>
    </StepLayout>
  );
}
