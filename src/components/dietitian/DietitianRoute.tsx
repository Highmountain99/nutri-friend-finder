import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDietist } from "@/hooks/useIsDietist";
import { OrganicLoader } from "@/components/ui/OrganicLoader";

export function DietitianRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { isDietist, isLoading, isError } = useIsDietist();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <OrganicLoader size={32} />
      </div>
    );
  }

  if (!user) return <Navigate to="/dietitian/login" replace />;

  // Never drop a dietitian into the patient app: on an unresolved/failed role
  // check we send them back to the dietitian login, not to /home.
  if (!isDietist) {
    return <Navigate to={isError ? "/dietitian/login" : "/home"} replace />;
  }

  return <Outlet />;
}
