import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AISuggestion } from "@/components/dietitian/clinical-notes/types";

export function useClinicalNoteAI() {
  const [isLoading, setIsLoading] = useState(false);

  const requestAI = async (params: {
    areaId: string;
    areaTitle: string;
    formData: Record<string, any>;
  }): Promise<AISuggestion | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("clinical-note-ai", {
        body: params,
      });

      if (error) {
        console.error("AI error:", error);
        toast.error("Kunde inte generera AI-förslag");
        return null;
      }

      return data as AISuggestion;
    } catch (e) {
      console.error("AI request failed:", e);
      toast.error("Något gick fel vid AI-anropet");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { requestAI, isLoading };
}
