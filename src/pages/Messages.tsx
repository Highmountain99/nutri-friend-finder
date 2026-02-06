import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointments } from "@/hooks/useAppointments";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { ChatMessage } from "@/components/messages/ChatMessage";

export default function Messages() {
  const { getUpcomingAppointment, loading: appointmentLoading } = useAppointments();
  const upcomingAppointment = getUpcomingAppointment();
  const { messages, loading: messagesLoading, sending, error, sendMessage } = useChatMessages();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get dietitian info from appointment
  const dietitian = upcomingAppointment?.dietitian;
  const dietitianInfo = dietitian
    ? {
        firstName: dietitian.firstName,
        lastName: dietitian.lastName,
        title: dietitian.title || "Legitimerad dietist",
        avatarUrl: dietitian.avatarUrl,
      }
    : null;

  // Check if any message has been escalated
  const hasEscalation = messages.some((msg) => msg.escalated);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loading = appointmentLoading || messagesLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Header */}
      <ChatHeader
        loading={loading}
        dietitian={dietitianInfo}
        isEscalated={hasEscalation}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-3xl">🥗</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Välkommen till EatSuite Assistenten!
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ställ frågor om din kost och behandling. Jag hjälper dig snabbt med vanliga frågor, och din dietist tar vid vid behov.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              content={msg.content}
              timestamp={msg.created_at}
              dietitian={dietitianInfo}
              escalated={msg.escalated}
            />
          ))
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

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground flex-shrink-0"
            disabled
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ett meddelande..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none py-2"
            rows={1}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={!inputValue.trim() || sending}
            className="flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
