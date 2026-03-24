import { useState } from "react";
import { useProgressData } from "@/hooks/useProgressData";
import { WeightLossProgress } from "./WeightLossProgress";
import { DiabetesProgress } from "./DiabetesProgress";
import { GutHealthProgress } from "./GutHealthProgress";
import { EatingDisorderProgress } from "./EatingDisorderProgress";
import { HeartHealthProgress } from "./HeartHealthProgress";
import { WomensHealthProgress } from "./WomensHealthProgress";
import { GeneralHealthProgress } from "./GeneralHealthProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { usePatientBlocks } from "@/hooks/usePatientBlocks";
import { DynamicBlock } from "./shared/DynamicBlock";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProgressRouter() {
  const { user } = useAuth();
  const [previewMode, setPreviewMode] = useState(false);
  const progressData = useProgressData();
  const { data: patientBlocks } = usePatientBlocks(user?.id);
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const navigate = useNavigate();

  const hasCompletedAppointment = appointments.some(
    (apt) => apt.status === "completed"
  );

  if (progressData.loading || appointmentsLoading) {
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

  // Render dynamic blocks from block builder
  const dynamicBlocks = patientBlocks && patientBlocks.length > 0 ? (
    <div className="px-4 space-y-3 mt-4">
      {patientBlocks.map((bd) => (
        <DynamicBlock key={bd.block.id} data={bd} />
      ))}
    </div>
  ) : null;

  // Route to appropriate layout based on concern category (unified or legacy)
  const mainContent = (() => {
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
  })();

  // If no completed appointment yet, show locked state with blurred background
  if (!hasCompletedAppointment && !previewMode) {
    return (
      <div className="relative h-[calc(100vh-8rem)] overflow-hidden">
        {/* Blurred background content */}
        <div className="pointer-events-none select-none blur-md opacity-50" aria-hidden="true">
          {mainContent}
          {dynamicBlocks}
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-lg p-8 mx-6 text-center max-w-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CalendarPlus className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Din utvecklingsplan väntar
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Din utvecklingsplan aktiveras när du haft ett möte med din personliga dietist.
            </p>
            <Button
              className="w-full rounded-xl"
              size="lg"
              onClick={() => navigate("/booking")}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Boka tid med dietist
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-xl mt-2 text-muted-foreground"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Hur kan det se ut?
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Preview mode banner
  if (!hasCompletedAppointment && previewMode) {
    return (
      <>
        <div className="mx-4 mb-4 mt-2 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Förhandsvisning</p>
            <p className="text-xs text-muted-foreground mt-0.5">Boka ett möte för att aktivera din plan</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 shrink-0" onClick={() => setPreviewMode(false)}>
            Tillbaka
          </Button>
        </div>
        {mainContent}
        {dynamicBlocks}
      </>
    );
  }

  return (
    <>
      {mainContent}
      {dynamicBlocks}
    </>
  );
}
