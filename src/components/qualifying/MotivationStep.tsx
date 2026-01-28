import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MotivationLevel, motivationLevelLabels } from '@/types/intake';
import { cn } from '@/lib/utils';

interface MotivationStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { motivationLevel: MotivationLevel }) => void;
  onBack: () => void;
  initialValue?: MotivationLevel;
}


export function MotivationStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialValue,
}: MotivationStepProps) {
  const [motivationLevel, setMotivationLevel] = useState<MotivationLevel | undefined>(initialValue);

  const handleNext = () => {
    if (!motivationLevel) return;
    onNext({ motivationLevel });
  };

  const levels: MotivationLevel[] = ['excited', 'curious', 'hesitant', 'not_ready'];

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Hur motiverad är du att göra förändringar för att nå dina mål?"
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!motivationLevel}
    >
      <RadioGroup
        value={motivationLevel}
        onValueChange={(value) => setMotivationLevel(value as MotivationLevel)}
        className="space-y-3"
      >
        {levels.map((level) => (
          <label
            key={level}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
              motivationLevel === level
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value={level} id={level} />
            <span className="font-medium">{motivationLevelLabels[level]}</span>
          </label>
        ))}
      </RadioGroup>
    </StepLayout>
  );
}
