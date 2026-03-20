import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import type { ChatAttachment } from "@/components/messages/ChatAttachmentPicker";

async function sendPushToPatient(patientId: string) {
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: {
        user_id: patientId,
        title: "Nytt meddelande",
        message: "Din dietist har skickat ett meddelande",
        url: "/messages",
      },
    });
  } catch {
    // Silent fail – push is best-effort
  }
}

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
    mutationFn: async ({ content, attachments }: { content: string; attachments?: ChatAttachment[] }) => {
      const { error } = await supabase.from("chat_messages").insert({
        user_id: patientId!,
        sender: "dietitian",
        content,
        conversation_type: "dietitian",
        status: "sent",
        attachments: (attachments || []) as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-chat", patientId] });
      if (patientId) sendPushToPatient(patientId);
    },
    onError: (err) => {
      toast.error("Kunde inte skicka meddelandet", {
        description: err instanceof Error ? err.message : "Försök igen",
      });
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
      if (patientId) sendPushToPatient(patientId);
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
      if (patientId) sendPushToPatient(patientId);
    },
  });

  // Dismiss AI draft
  const dismissDraft = useMutation({
    mutationFn: async (messageId: string) => {
      const { error: deleteError } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId);
      if (deleteError) {
        await supabase
          .from("chat_messages")
          .update({ status: "rejected" } as any)
          .eq("id", messageId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-chat", patientId] });
    },
  });

  return { messages, sendMessage, approveDraft, rejectAndReplace, dismissDraft };
}
