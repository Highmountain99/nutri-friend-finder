import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { screeningOptions, wantDietistOption, noneOfTheAboveOption } from '@/data/screeningQuestions';
import { RedFlagSymptom } from '@/types/intake';
import { cn } from '@/lib/utils';
import { Check, Info, Stethoscope } from 'lucide-react';

interface ScreeningStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    redFlagSymptoms: RedFlagSymptom[];
    showPregnancyTriage: boolean;
    wantsDietist: boolean;
  }) => void;
  onBack: () => void;
  initialSymptoms?: RedFlagSymptom[];
  initialWantsDietist?: boolean;
}

export function ScreeningStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialSymptoms = [],
  initialWantsDietist = false,
}: ScreeningStepProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<RedFlagSymptom[]>(initialSymptoms);
  const [noneSelected, setNoneSelected] = useState(false);
  const [wantsDietist, setWantsDietist] = useState(initialWantsDietist);

  const handleSymptomToggle = (symptom: RedFlagSymptom) => {
    setNoneSelected(false);
    setWantsDietist(false);
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
    setWantsDietist(false);
    setSelectedSymptoms([]);
  };

  const handleWantDietistToggle = () => {
    setWantsDietist(true);
    setNoneSelected(false);
    setSelectedSymptoms([]);
  };

  const handleNext = () => {
    const showPregnancyTriage = selectedSymptoms.includes('pregnancy');
    onNext({
      redFlagSymptoms: selectedSymptoms,
      showPregnancyTriage,
      wantsDietist,
    });
  };

  // Can always proceed - none of the options are required
  const isNextDisabled = selectedSymptoms.length === 0 && !noneSelected && !wantsDietist;

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
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-primary-soft rounded-xl mb-6">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Du kan alltid träffa en dietist oavsett vad du väljer här. Vi frågar bara för att kunna ge dig bästa möjliga rekommendation.
          </p>
        </div>

        {/* Screening options */}
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

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-sm text-muted-foreground">eller</span>
          </div>
        </div>

        {/* Want dietist option - special styling */}
        <button
          onClick={handleWantDietistToggle}
          className={cn(
            "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
            wantsDietist
              ? "border-primary bg-primary/10"
              : "border-primary/30 hover:border-primary/50 bg-primary/5"
          )}
        >
          <div className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            wantsDietist
              ? "bg-primary border-primary"
              : "border-primary/50"
          )}>
            {wantsDietist ? (
              <Check className="w-4 h-4 text-primary-foreground" />
            ) : (
              <Stethoscope className="w-3 h-3 text-primary" />
            )}
          </div>
          <span className="font-medium text-foreground">{wantDietistOption.label}</span>
        </button>

        {/* None of the above */}
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
