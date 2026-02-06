import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { UnifiedConcernCategory, unifiedCategoryLabels } from '@/types/intake';
import { cn } from '@/lib/utils';

interface ProblemStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    unifiedConcernCategory?: UnifiedConcernCategory;
    isPregnant: boolean;
  }) => void;
  onBack: () => void;
  initialCategory?: UnifiedConcernCategory;
  suggestedCategory?: UnifiedConcernCategory;
  initialIsPregnant?: boolean;
}

export function ProblemStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialCategory,
  suggestedCategory,
  initialIsPregnant = false,
}: ProblemStepProps) {
  const [category, setCategory] = useState<UnifiedConcernCategory | undefined>(
    initialCategory || suggestedCategory
  );
  const [isPregnant, setIsPregnant] = useState(initialIsPregnant);

  const handleCategorySelect = (cat: UnifiedConcernCategory) => {
    setCategory(cat);
    setIsPregnant(false); // Deselect pregnancy if a category is selected
  };

  const handlePregnancySelect = () => {
    setIsPregnant(true);
    setCategory(undefined); // Deselect category if pregnancy is selected
  };

  const handleNext = () => {
    onNext({
      unifiedConcernCategory: category,
      isPregnant,
    });
  };

  const handleSkip = () => {
    onNext({
      unifiedConcernCategory: undefined,
      isPregnant: false,
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
      <div className="grid grid-cols-2 gap-2">
        {/* Pregnancy option */}
        <button
          onClick={handlePregnancySelect}
          className={cn(
            "p-3 rounded-lg border text-left transition-all text-sm",
            isPregnant
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border hover:border-primary/50"
          )}
        >
          Gravid/nyligen gravid
        </button>

        {(Object.keys(unifiedCategoryLabels) as UnifiedConcernCategory[]).map((cat) => {
          const isSelected = category === cat && !isPregnant;
          const isSuggested = suggestedCategory === cat && !category && !isPregnant;
          
          return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all text-sm",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : isSuggested
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              {unifiedCategoryLabels[cat]}
              {isSuggested && !isSelected && (
                <span className="block text-xs text-primary mt-0.5">
                  Föreslaget
                </span>
              )}
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
}
