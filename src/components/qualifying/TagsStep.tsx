import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { preferenceTagOptions } from '@/types/intake';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TagsStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { preferenceTags: string[] }) => void;
  onBack: () => void;
  initialTags?: string[];
}

export function TagsStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialTags = [],
}: TagsStepProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleNext = () => {
    onNext({ preferenceTags: selectedTags });
  };

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Berätta mer om dig"
      subtitle="Markera alla som stämmer in på dig"
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={false} // Can skip this step
    >
      <div className="space-y-6">
        {Object.entries(preferenceTagOptions).map(([groupKey, group]) => (
          <div key={groupKey} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = selectedTags.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleTagToggle(option.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </StepLayout>
  );
}
