import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatAttachment } from "@/components/messages/ChatAttachmentPicker";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "dietitian";
  content: string;
  created_at: string;
  escalated?: boolean;
  escalation_reason?: string;
  attachments?: ChatAttachment[];
}

export function useChatMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing messages
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, sender, content, created_at, escalated, escalation_reason, status, attachments")
        .eq("user_id", user.id)
        .or("status.eq.sent,status.is.null")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        setError("Kunde inte ladda meddelanden");
      } else {
        setMessages((data || []).map((d) => ({
          ...d,
          sender: d.sender as ChatMessage["sender"],
          attachments: (d.attachments || []) as unknown as ChatAttachment[],
        })));
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("chat_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage & { status?: string };
          // Only add if status is 'sent' (not draft) and from dietitian or AI
          if (newMessage.sender !== "user" && (!newMessage.status || newMessage.status === "sent")) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Send message and stream AI response
  const sendMessage = useCallback(
    async (messageText: string, attachments?: ChatAttachment[]) => {
      if (!user || (!messageText.trim() && (!attachments || attachments.length === 0))) return;

      setSending(true);
      setError(null);

      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sender: "user",
        content: messageText.trim(),
        created_at: new Date().toISOString(),
        attachments: attachments || [],
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error("Inte inloggad");
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: messageText.trim(),
              conversationHistory: messages.slice(-10),
              attachments: attachments || [],
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Ett fel uppstod");
        }

        // AI response is saved as draft for dietitian approval – no streaming
        // Just update the user message with the real ID from server
        // Patient will see the response once dietitian approves it
      } catch (err) {
        console.error("Send message error:", err);
        setError(err instanceof Error ? err.message : "Ett fel uppstod");
        // Remove the optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setSending(false);
      }
    },
    [user, messages]
  );

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
  };
}
