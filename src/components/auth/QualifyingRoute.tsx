import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIntakeProfile } from "@/hooks/useIntakeProfile";
import { Loader2 } from "lucide-react";

interface QualifyingRouteProps {
  requireQualifying?: boolean;
}

export function QualifyingRoute({ requireQualifying = false }: QualifyingRouteProps) {
  const { session, isLoading: authLoading } = useAuth();
  const { isCompleted, loading: profileLoading } = useIntakeProfile();

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
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
