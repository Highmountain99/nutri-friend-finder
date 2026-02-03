import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DietitianFilters, FilterState } from "./DietitianFilters";
import { DietitianListItem } from "./DietitianListItem";
import { DietitianProfile } from "@/types/dietitian";
import { useDietitians } from "@/hooks/useDietitians";
import { useDietitianAvailabilityRange } from "@/hooks/useDietitianAvailability";
import { addDays } from "date-fns";

interface DietitianListProps {
  onBack: () => void;
  onSelectDietitian: (dietitian: DietitianProfile) => void;
}

export function DietitianList({ onBack, onSelectDietitian }: DietitianListProps) {
  const [filters, setFilters] = useState<FilterState>({
    specializations: [],
    languages: [],
    date: undefined,
  });

  const { dietitians, loading } = useDietitians({
    specializations: filters.specializations.length > 0 ? filters.specializations : undefined,
    languages: filters.languages.length > 0 ? filters.languages : undefined,
    date: filters.date,
  });

  return (
    <div className="px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Alla dietister</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Laddar...' : `${dietitians.length} tillgängliga`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <DietitianFilters filters={filters} onChange={setFilters} />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : dietitians.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Inga dietister matchar dina filter.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setFilters({ specializations: [], languages: [], date: undefined })}
          >
            Rensa filter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {dietitians.map((dietitian) => (
            <DietitianListItemWithAvailability
              key={dietitian.id}
              dietitian={dietitian}
              onClick={() => onSelectDietitian(dietitian)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to load availability for each list item
function DietitianListItemWithAvailability({
  dietitian,
  onClick,
}: {
  dietitian: DietitianProfile;
  onClick: () => void;
}) {
  const today = new Date();
  const { availabilities, getNextAvailableSlot } = useDietitianAvailabilityRange(
    dietitian.id,
    today,
    addDays(today, 14)
  );

  const nextAvailable = getNextAvailableSlot();
  
  // Count additional slots
  const additionalCount = availabilities.reduce((count, avail) => {
    const freeSlots = avail.timeSlots.filter((s) => !s.booked).length;
    return count + freeSlots;
  }, 0) - 1; // Subtract 1 for the "next available" slot

  return (
    <DietitianListItem
      dietitian={dietitian}
      nextAvailable={nextAvailable}
      additionalSlotsCount={Math.max(0, additionalCount)}
      onClick={onClick}
    />
  );
}
