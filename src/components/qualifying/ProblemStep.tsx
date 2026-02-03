import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { UnifiedConcernCategory, unifiedCategoryLabels } from '@/types/intake';
import { cn } from '@/lib/utils';

interface ProblemStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    unifiedConcernCategory?: UnifiedConcernCategory;
  }) => void;
  onBack: () => void;
  initialCategory?: UnifiedConcernCategory;
  suggestedCategory?: UnifiedConcernCategory;
}

export function ProblemStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialCategory,
  suggestedCategory,
}: ProblemStepProps) {
  const [category, setCategory] = useState<UnifiedConcernCategory | undefined>(
    initialCategory || suggestedCategory
  );

  const handleCategorySelect = (cat: UnifiedConcernCategory) => {
    setCategory(cat);
  };

  const handleNext = () => {
    onNext({
      unifiedConcernCategory: category,
    });
  };

  const handleSkip = () => {
    onNext({
      unifiedConcernCategory: undefined,
    });
  };

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Vad kan vi hjälpa dig med?"
      subtitle="Välj det som bäst beskriver ditt primära fokus just nu. Du kan hoppa över om du är osäker."
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={false}
      showSkip
      onSkip={handleSkip}
      skipLabel="Hoppa över"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(unifiedCategoryLabels) as UnifiedConcernCategory[]).map((cat) => {
            const isSelected = category === cat;
            const isSuggested = suggestedCategory === cat && !category;
            
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isSuggested
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="font-medium flex-1">{unifiedCategoryLabels[cat]}</span>
                {isSuggested && !isSelected && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Föreslaget
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </StepLayout>
  );
}
