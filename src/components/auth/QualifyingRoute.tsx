import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIntakeProfile } from "@/hooks/useIntakeProfile";
import { useIsDietist } from "@/hooks/useIsDietist";
import { OrganicLoader } from "@/components/ui/OrganicLoader";

interface QualifyingRouteProps {
  requireQualifying?: boolean;
}

export function QualifyingRoute({ requireQualifying = false }: QualifyingRouteProps) {
  const { session, isLoading: authLoading } = useAuth();
  const { isCompleted, loading: profileLoading } = useIntakeProfile();
  const { isDietist, isUnknown: roleUnknown } = useIsDietist();

  const isLoading = authLoading || profileLoading || roleUnknown;

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <OrganicLoader size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  // Dietitians never belong in the patient onboarding flow.
  if (isDietist) {
    return <Navigate to="/dietitian" replace />;
  }

  // If we need to check qualifying status
  if (requireQualifying) {
    // User must be in qualifying flow (not completed)
    if (isCompleted) {
      return <Navigate to="/home" replace />;
    }
    return <Outlet />;
  }

  // Default: require completed qualifying
  if (!isCompleted) {
    return <Navigate to="/qualifying" replace />;
  }

  return <Outlet />;
}

