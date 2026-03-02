import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDietitianProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dietitian-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietitian_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
