import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useDietitianChat(patientId: string | undefined) {
  const queryClient = useQueryClient();

  const messages = useQuery({
    queryKey: ["dietitian-chat", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", patientId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!patientId) return;
    const channel = supabase
      .channel(`chat-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${patientId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dietitian-chat", patientId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patientId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("chat_messages").insert({
        user_id: patientId!,
        sender: "dietitian",
        content,
        conversation_type: "dietitian",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-chat", patientId] });
    },
  });

  return { messages, sendMessage };
}
