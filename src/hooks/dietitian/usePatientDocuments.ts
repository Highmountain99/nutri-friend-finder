import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePatientDocuments(patientId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const documents = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_documents")
        .select("*")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      const filePath = `${patientId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("patient-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("patient-documents")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("patient_documents").insert({
        patient_id: patientId!,
        uploaded_by: user!.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-documents", patientId] }),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patient_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-documents", patientId] }),
  });

  return { documents, uploadDocument, deleteDocument };
}
