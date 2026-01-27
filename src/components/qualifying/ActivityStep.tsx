import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ActivityLevel, activityLevelLabels } from '@/types/intake';
import { cn } from '@/lib/utils';

interface ActivityStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { activityLevel: ActivityLevel }) => void;
  onBack: () => void;
  initialValue?: ActivityLevel;
}

const activityDescriptions: Record<ActivityLevel, string> = {
  sedentary: 'Kontorsarbete, lite eller ingen motion',
  lightly_active: 'Lätt motion 1-3 dagar/vecka',
  moderately_active: 'Måttlig motion 3-5 dagar/vecka',
  active: 'Hård träning 6-7 dagar/vecka',
  very_active: 'Mycket hård träning eller fysiskt jobb',
};

export function ActivityStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialValue,
}: ActivityStepProps) {
  // Map 'very_active' to 'active' for display since we only show 4 options
  const displayLevels: ActivityLevel[] = ['sedentary', 'lightly_active', 'moderately_active', 'active'];
  
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(initialValue);

  const handleNext = () => {
    if (!activityLevel) return;
    onNext({ activityLevel });
  };

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Vad är din nuvarande aktivitetsnivå?"
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!activityLevel}
    >
      <RadioGroup
        value={activityLevel}
        onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
        className="space-y-3"
      >
        {displayLevels.map((level) => (
          <label
            key={level}
            className={cn(
              "flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all",
              activityLevel === level
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value={level} id={level} />
              <span className="font-medium">{activityLevelLabels[level]}</span>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              {activityDescriptions[level]}
            </p>
          </label>
        ))}
      </RadioGroup>
    </StepLayout>
  );
}
