import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDietitianProfile } from "./useDietitianProfile";

export function useDietitianSchedule() {
  const { data: profile } = useDietitianProfile();
  const queryClient = useQueryClient();

  const appointments = useQuery({
    queryKey: ["dietitian-appointments", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("dietitian_id", profile!.id)
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const availability = useQuery({
    queryKey: ["dietitian-availability-own", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietitian_availability")
        .select("*")
        .eq("dietitian_id", profile!.id)
        .order("available_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const addAvailability = useMutation({
    mutationFn: async ({ date, slots }: { date: string; slots: string[] }) => {
      const { error } = await supabase
        .from("dietitian_availability")
        .upsert(
          {
            dietitian_id: profile!.id,
            available_date: date,
            time_slots: slots,
          },
          { onConflict: "dietitian_id,available_date" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-availability-own"] });
    },
  });

  const removeAvailability = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dietitian_availability")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-availability-own"] });
    },
  });

  return { appointments, availability, addAvailability, removeAvailability };
}
