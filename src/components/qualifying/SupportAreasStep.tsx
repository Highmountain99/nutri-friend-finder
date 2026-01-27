import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { Checkbox } from '@/components/ui/checkbox';
import { supportAreaOptions } from '@/types/intake';
import { cn } from '@/lib/utils';

interface SupportAreasStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { supportAreas: string[] }) => void;
  onBack: () => void;
  initialValue?: string[];
  suggestedAreas?: string[];
}

export function SupportAreasStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialValue = [],
  suggestedAreas = [],
}: SupportAreasStepProps) {
  // Merge initial and suggested, removing duplicates
  const mergedInitial = [...new Set([...initialValue, ...suggestedAreas])];
  const [selectedAreas, setSelectedAreas] = useState<string[]>(mergedInitial);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area]
    );
  };

  const handleNext = () => {
    onNext({ supportAreas: selectedAreas });
  };

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Vilka områden vill du ha mer stöd inom?"
      subtitle="Hälsosamma livsstilsförändringar ger bestående resultat. Din dietist kommer att arbeta tillsammans med dig för att individanpassa din plan utifrån dina behov!"
      onBack={onBack}
      onNext={handleNext}
    >
      <div className="space-y-3">
        {supportAreaOptions.map((option) => {
          const isSelected = selectedAreas.includes(option.value);
          const isSuggested = suggestedAreas.includes(option.value);
          
          return (
            <label
              key={option.value}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isSuggested && !isSelected && "border-primary/30 bg-primary/5"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleArea(option.value)}
              />
              <span className="font-medium flex-1">{option.label}</span>
              {isSuggested && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Föreslaget
                </span>
              )}
            </label>
          );
        })}
      </div>
    </StepLayout>
  );
}
