import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { CoachConcernCategory, coachCategoryLabels, coachSubcategoryOptions } from '@/types/intake';
import { cn } from '@/lib/utils';

interface CoachProblemStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    coachConcernCategory: CoachConcernCategory; 
    coachConcernSubcategory?: string;
  }) => void;
  onBack: () => void;
  initialCategory?: CoachConcernCategory;
  initialSubcategory?: string;
}

export function CoachProblemStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialCategory,
  initialSubcategory,
}: CoachProblemStepProps) {
  const [category, setCategory] = useState<CoachConcernCategory | undefined>(initialCategory);
  const [subcategory, setSubcategory] = useState<string | undefined>(initialSubcategory);

  const hasSubcategories = category && coachSubcategoryOptions[category];
  const subcategories = category ? coachSubcategoryOptions[category] : [];

  const handleCategorySelect = (cat: CoachConcernCategory) => {
    setCategory(cat);
    setSubcategory(undefined);
  };

  const handleNext = () => {
    if (!category) return;
    onNext({
      coachConcernCategory: category,
      coachConcernSubcategory: subcategory,
    });
  };

  // Require subcategory if the category has subcategories
  const isNextDisabled = !category || (hasSubcategories && !subcategory);

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={subcategory !== undefined || !hasSubcategories 
        ? "Vad kan vi hjälpa dig med?"
        : "Vilket beskriver bäst ditt främsta fokus?"
      }
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={isNextDisabled}
    >
      <div className="space-y-4">
        {/* Show category selection or subcategory selection */}
        {!category || (category && !hasSubcategories) ? (
          // Category selection
          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(coachCategoryLabels) as CoachConcernCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  category === cat
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="font-medium">{coachCategoryLabels[cat]}</span>
              </button>
            ))}
          </div>
        ) : (
          // Subcategory selection
          <div className="space-y-4">
            <button
              onClick={() => setCategory(undefined)}
              className="text-sm text-primary underline hover:text-primary/80"
            >
              ← Tillbaka till kategorier
            </button>

            <div className="p-3 bg-muted rounded-lg mb-4">
              <span className="font-medium">{coachCategoryLabels[category]}</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {subcategories?.map((sub) => (
                <button
                  key={sub.value}
                  onClick={() => setSubcategory(sub.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    subcategory === sub.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="font-medium">{sub.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
