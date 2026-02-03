import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { UnifiedConcernCategory, unifiedCategoryLabels } from '@/types/intake';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ProblemStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { 
    unifiedConcernCategory?: UnifiedConcernCategory;
    isPregnant: boolean;
    takesMedication: boolean;
  }) => void;
  onBack: () => void;
  initialCategory?: UnifiedConcernCategory;
  suggestedCategory?: UnifiedConcernCategory;
  initialIsPregnant?: boolean;
  initialTakesMedication?: boolean;
}

export function ProblemStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialCategory,
  suggestedCategory,
  initialIsPregnant = false,
  initialTakesMedication = false,
}: ProblemStepProps) {
  const [category, setCategory] = useState<UnifiedConcernCategory | undefined>(
    initialCategory || suggestedCategory
  );
  const [isPregnant, setIsPregnant] = useState(initialIsPregnant);
  const [takesMedication, setTakesMedication] = useState(initialTakesMedication);

  const handleCategorySelect = (cat: UnifiedConcernCategory) => {
    setCategory(cat);
  };

  const handleNext = () => {
    onNext({
      unifiedConcernCategory: category,
      isPregnant,
      takesMedication,
    });
  };

  const handleSkip = () => {
    onNext({
      unifiedConcernCategory: undefined,
      isPregnant,
      takesMedication,
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
      <div className="space-y-6">
        {/* Screening checkboxes at top */}
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <Checkbox
              id="pregnant"
              checked={isPregnant}
              onCheckedChange={(checked) => setIsPregnant(checked === true)}
              className="mt-0.5"
            />
            <Label 
              htmlFor="pregnant" 
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              Jag är gravid eller har nyligen varit gravid
            </Label>
          </div>
          
          <div className="flex items-start gap-3">
            <Checkbox
              id="medication"
              checked={takesMedication}
              onCheckedChange={(checked) => setTakesMedication(checked === true)}
              className="mt-0.5"
            />
            <Label 
              htmlFor="medication" 
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              Jag tar mediciner som kan påverka kosten
            </Label>
          </div>
        </div>

        {/* Category selection */}
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
