import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyDietitian } from "@/hooks/useMyDietitian";
import { useChatMessages, type ConversationType } from "@/hooks/useChatMessages";
import { useAuth } from "@/contexts/AuthContext";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { ChatMessage } from "@/components/messages/ChatMessage";
import { ChatAttachmentPicker, AttachmentPreview } from "@/components/messages/ChatAttachmentPicker";
import type { ChatAttachment } from "@/components/messages/ChatAttachmentPicker";

const AI_SUGGESTIONS = [
  "Vad kan jag äta istället för lök?",
  "Ge mig ett recept som passar mina mål",
  "Tips på mellanmål med mycket protein?",
];

export default function Messages() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ConversationType>("dietitian");
  const { data: myDietitian, isLoading: dietitianLoading } = useMyDietitian();
  const { messages, loading: messagesLoading, sending, error, sendMessage, markAsRead, markAllAsRead } =
    useChatMessages(mode);

  const [inputValue, setInputValue] = useState("");
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAi = mode === "ai";

  const dietitianInfo = myDietitian
    ? {
        id: myDietitian.id,
        firstName: myDietitian.first_name,
        lastName: myDietitian.last_name,
        title: myDietitian.title || "Coach",
        avatarUrl: myDietitian.avatar_url ?? undefined,
      }
    : null;

  const hasEscalation = messages.some((msg) => msg.escalated);

  // Scroll to bottom — instant on first paint, smooth on subsequent updates
  const hasScrolledInitially = useRef(false);
  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: hasScrolledInitially.current ? "smooth" : "auto",
      block: "end",
    });
    hasScrolledInitially.current = true;
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = async (overrideText?: string) => {
    const text = overrideText ?? inputValue;
    if ((!text.trim() && pendingAttachments.length === 0) || sending) return;
    const atts = isAi ? [] : [...pendingAttachments];
    if (!overrideText) setInputValue("");
    setPendingAttachments([]);
    await sendMessage(text, atts.length > 0 ? atts : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (messagesLoading || messages.length === 0) return;

    const hasUnreadIncomingMessages = messages.some(
      (message) => message.sender !== "user" && !message.read_at && !message.id.startsWith("temp-")
    );

    if (!hasUnreadIncomingMessages) return;

    void markAllAsRead();
  }, [messages, messagesLoading, markAllAsRead]);

  const loading = dietitianLoading || messagesLoading;

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-8rem-env(safe-area-inset-bottom))]">
        <ChatHeader
          loading={loading}
          dietitian={dietitianInfo}
          isEscalated={hasEscalation}
          mode={mode}
          onModeChange={setMode}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isAi && (
            <p className="text-center text-[11px] tracking-widest uppercase text-muted-foreground px-6">
              Svaren bygger på råd från legitimerade dietister · ej medicinsk rådgivning
            </p>
          )}

          {messagesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-48 rounded-2xl" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            isAi ? (
              <div className="rounded-2xl bg-card px-4 py-3">
                <p className="text-sm text-foreground">
                  Hej! Jag är din kostcoach — fråga mig vad som helst om din kost, dina måltider
                  eller recept som passar dina mål. Jag svarar direkt, dygnet runt.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-medium text-primary">?</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Hej!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Skriv till {dietitianInfo ? dietitianInfo.firstName : "din coach"} här. Vill du ha
                  svar direkt kan du fråga kostcoachen i fliken ovan.
                </p>
              </div>
            )
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                sender={msg.sender}
                content={msg.content}
                timestamp={msg.created_at}
                dietitian={dietitianInfo}
                escalated={msg.escalated}
                attachments={msg.attachments}
                onVisible={
                  msg.sender !== "user" && !msg.id.startsWith("temp-") && !msg.read_at
                    ? () => markAsRead(msg.id)
                    : undefined
                }
              />
            ))
          )}

          {/* Suggestion chips for the AI coach */}
          {isAi && !sending && messages.length === 0 && (
            <div className="flex flex-col items-end gap-2 pt-4">
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-foreground/70 px-4 py-2.5 text-sm text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Streaming indicator */}
          {sending && (
            <div className="flex gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card">
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingAttachments.map((att, i) => (
                <AttachmentPreview
                  key={i}
                  attachment={att}
                  onRemove={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            {!isAi && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground flex-shrink-0"
                onClick={() => setAttachmentPickerOpen(true)}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            )}
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAi ? "Fråga om din kost..." : "Skriv ett meddelande..."}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none py-2"
              rows={1}
              disabled={sending}
            />
            <Button
              onClick={() => handleSend()}
              size="icon"
              disabled={(!inputValue.trim() && pendingAttachments.length === 0) || sending}
              className="flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {user && !isAi && (
        <ChatAttachmentPicker
          patientId={user.id}
          open={attachmentPickerOpen}
          onOpenChange={setAttachmentPickerOpen}
          onAttach={(att) => setPendingAttachments((prev) => [...prev, att])}
        />
      )}
    </>
  );
}
