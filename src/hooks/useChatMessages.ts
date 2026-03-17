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
  read_at?: string | null;
  status?: string;
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
        .select("id, sender, content, created_at, escalated, escalation_reason, status, attachments, read_at")
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
          const newMessage = payload.new as ChatMessage;
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

  // Send message – mode "ai" sends AI response directly, "wait" creates AI draft for dietitian
  const sendMessage = useCallback(
    async (messageText: string, attachments?: ChatAttachment[], mode: "ai" | "wait" = "ai") => {
      if (!user || (!messageText.trim() && (!attachments || attachments.length === 0))) return;

      setSending(true);
      setError(null);

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
              mode,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Ett fel uppstod");
        }
      } catch (err) {
        console.error("Send message error:", err);
        setError(err instanceof Error ? err.message : "Ett fel uppstod");
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setSending(false);
      }
    },
    [user, messages]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!user || messageId.startsWith("temp-")) return;

      const targetMessage = messages.find((message) => message.id === messageId);
      if (!targetMessage || targetMessage.sender === "user" || targetMessage.read_at) return;

      const readAt = new Date().toISOString();
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, read_at: readAt } : message
        )
      );

      const { error } = await supabase.rpc("mark_chat_message_read", {
        _message_id: messageId,
      });

      if (error) {
        console.error("Error marking chat message as read:", error);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, read_at: null } : message
          )
        );
      }
    },
    [user, messages]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return 0;

    const unreadIncomingMessageIds = messages
      .filter(
        (message) => message.sender !== "user" && !message.read_at && !message.id.startsWith("temp-")
      )
      .map((message) => message.id);

    if (unreadIncomingMessageIds.length === 0) return 0;

    const readAt = new Date().toISOString();
    setMessages((prev) =>
      prev.map((message) =>
        unreadIncomingMessageIds.includes(message.id)
          ? { ...message, read_at: readAt }
          : message
      )
    );

    const { data, error } = await supabase.rpc("mark_all_chat_messages_read");

    if (error) {
      console.error("Error marking all chat messages as read:", error);
      setMessages((prev) =>
        prev.map((message) =>
          unreadIncomingMessageIds.includes(message.id)
            ? { ...message, read_at: null }
            : message
        )
      );
      return 0;
    }

    return data ?? 0;
  }, [user, messages]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    markAsRead,
    markAllAsRead,
  };
}