import { useState, useCallback } from "react";
import { ArrowLeft, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DietitianCard } from "./DietitianCard";
import { DietitianProfile, TimeSlot } from "@/types/dietitian";
import { useDietitianRecommendations } from "@/hooks/useDietitianRecommendations";
import { useDietitianAvailabilityRange } from "@/hooks/useDietitianAvailability";
import { format, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { OrganicLoader } from "@/components/ui/OrganicLoader";

interface DietitianRecommendationsProps {
  selectedDate: Date;
  onBack: () => void;
  onSelectDietitian: (dietitian: DietitianProfile) => void;
  onShowAll: () => void;
}

export function DietitianRecommendations({
  selectedDate,
  onBack,
  onSelectDietitian,
  onShowAll,
}: DietitianRecommendationsProps) {
  const { recommendations, loading } = useDietitianRecommendations(selectedDate, 5);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Set up event listener
  useState(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  });

  // Total items = recommendations + "show all" card
  const totalItems = recommendations.length + 1;

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Rekommenderade dietister</h1>
            <p className="text-sm text-muted-foreground">Laddar...</p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <OrganicLoader size={72} />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 animate-fade-in">
      {/* Header */}
      <div className="px-4 flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Rekommenderade dietister</h1>
          <p className="text-sm text-muted-foreground">
            Tillgängliga {format(selectedDate, "d MMMM", { locale: sv })}
          </p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="px-4 text-center py-12">
          <p className="text-muted-foreground mb-4">
            Inga dietister tillgängliga detta datum.
          </p>
          <Button onClick={onShowAll}>Visa alla dietister</Button>
        </div>
      ) : (
        <>
          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {recommendations.map(({ dietitian, matchingSpecializations }) => (
                <div key={dietitian.id} className="flex-[0_0_85%] min-w-0 px-2 first:pl-4 last:pr-4">
                  <DietitianCardWithAvailability
                    dietitian={dietitian}
                    matchingSpecializations={matchingSpecializations}
                    selectedDate={selectedDate}
                    onSelect={onSelectDietitian}
                  />
                </div>
              ))}
              
              {/* Show All Card */}
              <div className="flex-[0_0_85%] min-w-0 px-2 pr-4">
                <Card 
                  className="shadow-soft cursor-pointer hover:shadow-md transition-shadow h-full"
                  onClick={onShowAll}
                >
                  <CardContent className="p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Visa alla dietister
                    </h3>
                    <p className="text-muted-foreground">
                      Bläddra bland alla våra tillgängliga dietister
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-4 flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollPrev}
              disabled={selectedIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {[...Array(totalItems)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === selectedIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={scrollNext}
              disabled={selectedIndex === totalItems - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// Helper component to load availability per dietitian
function DietitianCardWithAvailability({
  dietitian,
  matchingSpecializations,
  selectedDate,
  onSelect,
}: {
  dietitian: DietitianProfile;
  matchingSpecializations: string[];
  selectedDate: Date;
  onSelect: (dietitian: DietitianProfile) => void;
}) {
  const { getNextAvailableSlot } = useDietitianAvailabilityRange(
    dietitian.id,
    selectedDate,
    addDays(selectedDate, 7)
  );

  return (
    <DietitianCard
      dietitian={dietitian}
      matchingSpecializations={matchingSpecializations}
      nextAvailable={getNextAvailableSlot()}
      onSelect={onSelect}
    />
  );
}
