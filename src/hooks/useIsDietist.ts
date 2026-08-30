import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Shared dietitian-role check. Cached across the app so route guards
 * never bounce a dietitian into the patient onboarding flow because of
 * a transient refetch or network error.
 */
export function useIsDietist() {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["user-role-dietist", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "dietist" as const,
      });
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    isDietist: query.data === true,
    // Unknown while auth resolves, while the role loads, or when the check failed.
    isUnknown: authLoading || (!!user && (query.isLoading || query.isError)),
    isLoading: authLoading || (!!user && query.isLoading),
    isError: query.isError,
  };
}
