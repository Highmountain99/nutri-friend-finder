import { useState, useRef } from 'react';
import { StepLayout } from './StepLayout';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev < reviews.length - 1 ? prev + 1 : reviews.length - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    setTouchStart(null);
  };

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Hjälper miljontals människor att leva hälsosammare"
      onBack={onBack}
      onNext={onNext}
    >
      <div className="space-y-6">
        {/* Carousel */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="w-full flex-shrink-0 px-1"
              >
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4 min-h-[200px] flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-star-rating text-star-rating"
                      />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-foreground leading-relaxed flex-1">
                    "{review.text}"
                  </p>

                  {/* Author */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground mt-auto">
                    <span className="font-medium">{review.name}</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                activeIndex === index ? "bg-primary" : "bg-muted"
              )}
              aria-label={`Visa recension ${index + 1}`}
            />
          ))}
        </div>

        {/* Trustpilot-style badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
