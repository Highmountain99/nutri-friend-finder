import { StepLayout } from './StepLayout';
import { Star } from 'lucide-react';

interface ReviewsStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
}

const reviews = [
  {
    id: 1,
    rating: 5,
    text: "Min dietist har hjälpt mig att förstå min IBS på ett helt nytt sätt. Tack vare FODMAP-guiden har jag äntligen kontroll över mina symtom!",
    name: "Anna K.",
    date: "December 2025",
  },
  {
    id: 2,
    rating: 5,
    text: "Efter bara 3 månader har jag gått ner 8 kg och lärt mig äta utan att räkna kalorier. Min relation till mat har förändrats helt.",
    name: "Erik S.",
    date: "November 2025",
  },
  {
    id: 3,
    rating: 5,
    text: "Som diabetiker typ 2 har jag fått ovärderlig hjälp. Mitt HbA1c har sjunkit och jag mår bättre än på flera år.",
    name: "Maria L.",
    date: "Januari 2026",
  },
  {
    id: 4,
    rating: 5,
    text: "Jag var skeptisk till digitala besök men det fungerar verkligen. Min dietist är alltid tillgänglig via meddelanden.",
    name: "Johan P.",
    date: "December 2025",
  },
];

export function ReviewsStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: ReviewsStepProps) {
  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Hjälper miljontals människor att leva hälsosammare"
      onBack={onBack}
      onNext={onNext}
    >
      <div className="space-y-4">
        {/* All reviews in a vertical list */}
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            {/* Stars */}
            <div className="flex gap-1">
              {[...Array(review.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-star-rating text-star-rating"
                />
              ))}
            </div>

            {/* Review text */}
            <p className="text-foreground text-sm leading-relaxed">
              "{review.text}"
            </p>

            {/* Author */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="font-medium">{review.name}</span>
              <span>{review.date}</span>
            </div>
          </div>
        ))}

        {/* Trustpilot-style badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-trustpilot text-trustpilot" />
            ))}
          </div>
          <span>4,9 av 5 baserat på 1 500+ recensioner</span>
        </div>
      </div>
    </StepLayout>
  );
}
