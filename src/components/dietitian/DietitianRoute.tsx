import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrganicLoader } from "@/components/ui/OrganicLoader";

export function DietitianRoute() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: isDietist, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role-dietist", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "dietist" as const,
      });
      return !!data;
    },
    enabled: !!user,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <OrganicLoader size={32} />
      </div>
    );
  }

  if (!user) return <Navigate to="/dietitian/login" replace />;
  if (!isDietist) return <Navigate to="/home" replace />;

  return <Outlet />;
}
