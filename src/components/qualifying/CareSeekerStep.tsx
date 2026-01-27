import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CareSeekerType, RelationshipType } from '@/types/intake';
import { cn } from '@/lib/utils';

interface CareSeekerStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: { careSeekerType: CareSeekerType; relationshipIfOther?: RelationshipType }) => void;
  onBack: () => void;
  initialCareSeekerType?: CareSeekerType;
  initialRelationship?: RelationshipType;
}

export function CareSeekerStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  initialCareSeekerType,
  initialRelationship,
}: CareSeekerStepProps) {
  const [careSeekerType, setCareSeekerType] = useState<CareSeekerType | undefined>(initialCareSeekerType);
  const [relationship, setRelationship] = useState<RelationshipType | undefined>(initialRelationship);

  const handleNext = () => {
    if (!careSeekerType) return;
    onNext({
      careSeekerType,
      relationshipIfOther: careSeekerType === 'other' ? relationship : undefined,
    });
  };

  const isNextDisabled = !careSeekerType || (careSeekerType === 'other' && !relationship);

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Vem söker vård?"
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={isNextDisabled}
    >
      <div className="space-y-6">
        <RadioGroup
          value={careSeekerType}
          onValueChange={(value) => setCareSeekerType(value as CareSeekerType)}
          className="space-y-3"
        >
          <label
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
              careSeekerType === 'self'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="self" id="self" />
            <span className="font-medium">Jag söker åt mig själv</span>
          </label>

          <label
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
              careSeekerType === 'other'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="other" id="other" />
            <span className="font-medium">Jag söker åt någon annan</span>
          </label>
        </RadioGroup>

        {/* Relationship options when "other" is selected */}
        {careSeekerType === 'other' && (
          <div className="space-y-3 pl-4 border-l-2 border-primary/30">
            <p className="text-sm text-muted-foreground mb-3">Vilken relation har du?</p>
            <RadioGroup
              value={relationship}
              onValueChange={(value) => setRelationship(value as RelationshipType)}
              className="space-y-2"
            >
              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  relationship === 'guardian'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="guardian" id="guardian" />
                <span>Jag är målsman</span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  relationship === 'trustee'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="trustee" id="trustee" />
                <span>Jag är god man</span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  relationship === 'relative'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="relative" id="relative" />
                <span>Jag är närstående</span>
              </label>
            </RadioGroup>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
