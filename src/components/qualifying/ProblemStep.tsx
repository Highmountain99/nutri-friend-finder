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
      <div className="space-y-4">
        {/* Category selection */}
        <div className="grid grid-cols-1 gap-3">
          {/* Pregnancy option as a button */}
          <button
            onClick={handlePregnancySelect}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
              isPregnant
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <span className="font-medium flex-1">Jag är gravid eller har nyligen varit gravid</span>
          </button>

          {(Object.keys(unifiedCategoryLabels) as UnifiedConcernCategory[]).map((cat) => {
            const isSelected = category === cat && !isPregnant;
            const isSuggested = suggestedCategory === cat && !category && !isPregnant;
            
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
