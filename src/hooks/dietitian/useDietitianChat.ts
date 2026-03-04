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
          event: "*",
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
        status: "sent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-chat", patientId] });
    },
  });

  // Approve AI draft – changes status to 'sent' so patient can see it
  const approveDraft = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("chat_messages")
        .update({ status: "sent" } as any)
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-chat", patientId] });
    },
  });

  // Reject AI draft and send dietitian's own message instead
  const rejectAndReplace = useMutation({
    mutationFn: async ({ draftId, newContent }: { draftId: string; newContent: string }) => {
      // Delete the draft
      const { error: deleteError } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", draftId);
      // If can't delete (RLS), just update status to 'rejected'
      if (deleteError) {
        await supabase
          .from("chat_messages")
          .update({ status: "rejected" } as any)
          .eq("id", draftId);
      }
      // Send dietitian's own message
      const { error } = await supabase.from("chat_messages").insert({
        user_id: patientId!,
        sender: "dietitian",
        content: newContent,
        conversation_type: "dietitian",
        status: "sent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-chat", patientId] });
    },
  });

  return { messages, sendMessage, approveDraft, rejectAndReplace };
}
