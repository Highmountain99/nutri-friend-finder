import { useProgressData } from "@/hooks/useProgressData";
import { WeightLossProgress } from "./WeightLossProgress";
import { DiabetesProgress } from "./DiabetesProgress";
import { GutHealthProgress } from "./GutHealthProgress";
import { EatingDisorderProgress } from "./EatingDisorderProgress";
import { HeartHealthProgress } from "./HeartHealthProgress";
import { WomensHealthProgress } from "./WomensHealthProgress";
import { GeneralHealthProgress } from "./GeneralHealthProgress";
import { Skeleton } from "@/components/ui/skeleton";

export function ProgressRouter() {
  const progressData = useProgressData();

  if (progressData.loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const show = (section: string) => progressData.visibleSections.includes(section);

  // Route to appropriate layout based on concern category (unified or legacy)
  switch (progressData.concernCategory) {
    case 'weight_loss':
      return <WeightLossProgress data={progressData} show={show} />;
    case 'muscle_building':
    case 'training_nutrition':
    case 'energy_focus':
    case 'healthy_habits':
    case 'plant_based':
      return <GeneralHealthProgress data={progressData} show={show} />;
    case 'diabetes':
      return <DiabetesProgress data={progressData} show={show} />;
    case 'gut_health':
      return <GutHealthProgress data={progressData} show={show} />;
    case 'heart_health':
      return <HeartHealthProgress data={progressData} show={show} />;
    case 'eating_disorder':
    case 'emotional_eating':
      return <EatingDisorderProgress data={progressData} show={show} />;
    case 'womens_health':
      return <WomensHealthProgress data={progressData} show={show} />;
    case 'general_health':
    case 'other':
    default:
      return <GeneralHealthProgress data={progressData} show={show} />;
  }
}
