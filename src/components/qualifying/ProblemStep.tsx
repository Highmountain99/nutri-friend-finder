import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { PrimaryConcernCategory, categoryLabels, subcategoryOptions } from '@/types/intake';
import { cn } from '@/lib/utils';

interface ProblemStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    primaryConcernCategory: PrimaryConcernCategory; 
    primaryConcernSubcategory?: string;
    concernTags: string[];
  }) => void;
  onBack: () => void;
  initialCategory?: PrimaryConcernCategory;
  initialSubcategory?: string;
  initialTags?: string[];
  suggestedCategory?: PrimaryConcernCategory;
  suggestedSubcategory?: string;
}

const categoryIcons: Record<PrimaryConcernCategory, string> = {
  weight_loss: '⚖️',
  diabetes: '🩸',
  gut_health: '🫃',
  general_health: '💚',
  womens_health: '👩',
  emotional_eating: '💭',
  eating_disorder: '🍽️',
  heart_health: '❤️',
  other: '✨',
};

export function ProblemStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialCategory,
  initialSubcategory,
  initialTags = [],
  suggestedCategory,
  suggestedSubcategory,
}: ProblemStepProps) {
  const [category, setCategory] = useState<PrimaryConcernCategory | undefined>(
    initialCategory || suggestedCategory
  );
  const [subcategory, setSubcategory] = useState<string | undefined>(
    initialSubcategory || suggestedSubcategory
  );
  const [tags, setTags] = useState<string[]>(initialTags);

  const hasSubcategories = category && subcategoryOptions[category];
  const subcategories = category ? subcategoryOptions[category] : [];

  const handleCategorySelect = (cat: PrimaryConcernCategory) => {
    setCategory(cat);
    setSubcategory(undefined);
  };

  const handleNext = () => {
    if (!category) return;
    onNext({
      primaryConcernCategory: category,
      primaryConcernSubcategory: subcategory,
      concernTags: tags,
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
        : "Vilket av följande beskriver bäst ditt främsta bekymmer?"
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
            {(Object.keys(categoryLabels) as PrimaryConcernCategory[]).map((cat) => (
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
                <span className="text-2xl">{categoryIcons[cat]}</span>
                <span className="font-medium">{categoryLabels[cat]}</span>
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
              <span className="text-2xl mr-2">{categoryIcons[category]}</span>
              <span className="font-medium">{categoryLabels[category]}</span>
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
