import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useJournalEntries(patientId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const entries = useQuery({
    queryKey: ["journal-entries", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietitian_journal_entries")
        .select("*")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: {
      anamnesis?: string;
      assessment?: string;
      action?: string;
      next_steps?: string;
      appointment_id?: string;
      form_data?: Record<string, any>;
      area_type?: string;
    }) => {
      const { error } = await supabase.from("dietitian_journal_entries").insert({
        patient_id: patientId!,
        dietitian_id: user!.id,
        ...entry,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-entries", patientId] }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; anamnesis?: string; assessment?: string; action?: string; next_steps?: string }) => {
      const { error } = await supabase
        .from("dietitian_journal_entries")
        .update(fields)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-entries", patientId] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("dietitian_journal_entries")
        .delete()
        .eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-entries", patientId] }),
  });

  return { entries, addEntry, updateEntry, deleteEntry };
}
