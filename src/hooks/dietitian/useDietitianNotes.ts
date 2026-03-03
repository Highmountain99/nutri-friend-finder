import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDietitianNotes(patientId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const notes = useQuery({
    queryKey: ["dietitian-notes", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietitian_notes")
        .select("*")
        .eq("patient_id", patientId!)
        .eq("dietitian_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId && !!user,
  });

  const upsertNote = useMutation({
    mutationFn: async ({ id, content }: { id?: string; content: string }) => {
      if (id) {
        const { error } = await supabase
          .from("dietitian_notes")
          .update({ content })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dietitian_notes").insert({
          patient_id: patientId!,
          dietitian_id: user!.id,
          content,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dietitian-notes", patientId] }),
  });

  return { notes, upsertNote };
}
