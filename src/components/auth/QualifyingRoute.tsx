import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDietist } from "@/hooks/useIsDietist";
import { OrganicLoader } from "@/components/ui/OrganicLoader";

/**
 * Simple auth guard for the client app.
 * There is no onboarding flow any more – a signed-in client goes straight in.
 */
export function QualifyingRoute() {
  const { session, isLoading: authLoading } = useAuth();
  const { isDietist, isUnknown: roleUnknown } = useIsDietist();

  if (authLoading || roleUnknown) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <OrganicLoader size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  // Coaches never belong in the client app.
  if (isDietist) {
    return <Navigate to="/dietitian" replace />;
  }

  return <Outlet />;
}
