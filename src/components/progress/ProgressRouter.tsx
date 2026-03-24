import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePatientBlocks } from "@/hooks/usePatientBlocks";
import { DynamicBlock } from "./shared/DynamicBlock";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Eye, FlagTriangleRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressRouterProps {
  onOpenJourney: () => void;
}

export function ProgressRouter({ onOpenJourney }: ProgressRouterProps) {
  const { user } = useAuth();
  const [previewMode, setPreviewMode] = useState(false);
  const { data: patientBlocks, isLoading: blocksLoading } = usePatientBlocks(user?.id);
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const navigate = useNavigate();

  const hasCompletedAppointment = appointments.some(
    (apt) => apt.status === "completed" || 
    (apt.status === "booked" && apt.appointmentDate < new Date())
  );

  if (blocksLoading || appointmentsLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const hasBlocks = patientBlocks && patientBlocks.length > 0;

  const dynamicBlocks = hasBlocks ? (
    <div className="px-4 py-6 space-y-3 pb-24">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-foreground">Din utveckling</h1>
        <p className="text-sm text-muted-foreground">Följ dina framsteg</p>
      </div>
      {patientBlocks.map((bd) => (
        <DynamicBlock key={bd.block.id} data={bd} />
      ))}
    </div>
  ) : (
    <div className="px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Din utveckling</h1>
        <p className="text-sm text-muted-foreground">Följ dina framsteg</p>
      </div>
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Inga block ännu
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Din dietist kommer att anpassa din utvecklingsvy med block som passar just din behandling.
        </p>
      </div>
    </div>
  );

  const journeyButton = (
    <button
      className="absolute top-2 right-4 z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
      onClick={onOpenJourney}
      aria-label="Visa programöversikt"
    >
      <FlagTriangleRight className="w-5 h-5 text-primary-foreground" />
    </button>
  );

  // If no completed appointment yet, show locked state
  if (!hasCompletedAppointment && !previewMode) {
    return (
      <div className="relative h-[calc(100vh-8rem)] overflow-hidden">
        <div className="pointer-events-none select-none blur-md opacity-50" aria-hidden="true">
          <div className="relative">
            {journeyButton}
          </div>
          {dynamicBlocks}
        </div>

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
      <div>
        <div className="mx-4 mb-2 mt-2 bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Förhandsvisning</p>
              <p className="text-xs text-muted-foreground mt-0.5">Det här är ett exempel på hur din plan kan se ut</p>
            </div>
            <Button size="sm" className="rounded-xl text-xs h-8 shrink-0" onClick={() => { setPreviewMode(false); navigate("/booking"); }}>
              <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
              Boka tid
            </Button>
          </div>
        </div>
        <div className="relative">
          {journeyButton}
          {dynamicBlocks}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {journeyButton}
      {dynamicBlocks}
    </div>
  );
}