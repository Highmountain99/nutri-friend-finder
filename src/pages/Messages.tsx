import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Loader2, Calendar, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointments } from "@/hooks/useAppointments";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuth } from "@/contexts/AuthContext";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { ChatMessage } from "@/components/messages/ChatMessage";
import { ChatBookingSheet } from "@/components/messages/ChatBookingSheet";
import { ChatAttachmentPicker, AttachmentPreview } from "@/components/messages/ChatAttachmentPicker";
import { ResponseChoiceDialog } from "@/components/messages/ResponseChoiceDialog";
import type { ChatAttachment } from "@/components/messages/ChatAttachmentPicker";

export default function Messages() {
  const { user } = useAuth();
  const { getUpcomingAppointment, loading: appointmentLoading } = useAppointments();
  const upcomingAppointment = getUpcomingAppointment();
  const { messages, loading: messagesLoading, sending, error, sendMessage, markAsRead, markAllAsRead } = useChatMessages();

  const [inputValue, setInputValue] = useState("");
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ text: string; attachments?: ChatAttachment[] } | null>(null);
  const [waitChosenAt, setWaitChosenAt] = useState<number | null>(null);
  const [aiFollowUpShown, setAiFollowUpShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get dietitian info from appointment
  const dietitian = upcomingAppointment?.dietitian;
  const dietitianInfo = dietitian
    ? {
        id: upcomingAppointment.dietitianId || '',
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

  // Check if user recently chose "wait" (within 30 min)
  const isInWaitWindow = waitChosenAt !== null && Date.now() - waitChosenAt < 30 * 60 * 1000;

  // After 10 min of waiting with no dietitian reply, offer AI follow-up
  useEffect(() => {
    if (!waitChosenAt || aiFollowUpShown) return;
    const elapsed = Date.now() - waitChosenAt;
    const delay = Math.max(10 * 60 * 1000 - elapsed, 0);

    // Check if dietitian has replied since choosing wait
    const hasDietitianReplySince = messages.some(
      (m) => m.sender === "dietitian" && new Date(m.created_at).getTime() > waitChosenAt
    );
    if (hasDietitianReplySince) return;

    const timer = setTimeout(() => {
      // Re-check dietitian reply at trigger time
      const replied = messages.some(
        (m) => m.sender === "dietitian" && new Date(m.created_at).getTime() > (waitChosenAt ?? 0)
      );
      if (!replied) {
        setAiFollowUpShown(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [waitChosenAt, aiFollowUpShown, messages]);

  const handleSend = async () => {
    if ((!inputValue.trim() && pendingAttachments.length === 0) || sending) return;
    const message = inputValue;
    const atts = [...pendingAttachments];
    setInputValue("");
    setPendingAttachments([]);

    // If user recently chose "wait", skip dialog and send in wait mode
    if (isInWaitWindow) {
      await sendMessage(message, atts.length > 0 ? atts : undefined, "wait");
      return;
    }

    setPendingMessage({ text: message, attachments: atts.length > 0 ? atts : undefined });
    setChoiceDialogOpen(true);
  };

  const handleResponseChoice = async (choice: "ai" | "wait") => {
    setChoiceDialogOpen(false);
    if (!pendingMessage) return;
    if (choice === "wait") {
      setWaitChosenAt(Date.now());
      setAiFollowUpShown(false);
    }
    await sendMessage(pendingMessage.text, pendingMessage.attachments, choice);
    setPendingMessage(null);
  };

  const handleAiFollowUp = async (accept: boolean) => {
    setAiFollowUpShown(false);
    if (accept) {
      // Reset wait window so next message shows dialog again
      setWaitChosenAt(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBookingRequest = () => {
    setBookingSheetOpen(true);
  };

  useEffect(() => {
    if (messagesLoading || messages.length === 0) return;

    const hasUnreadIncomingMessages = messages.some(
      (message) => message.sender !== "user" && !message.read_at && !message.id.startsWith("temp-")
    );

    if (!hasUnreadIncomingMessages) return;

    void markAllAsRead();
  }, [messages, messagesLoading, markAllAsRead]);

  const loading = appointmentLoading || messagesLoading;

  return (
    <>
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
                <span className="text-2xl font-medium text-primary">?</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Hej!
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Innan vi loopar in {dietitianInfo ? `${dietitianInfo.firstName}` : "din dietist"} kan vi se om vi kan svara på dina frågor utifrån din journal. Skriv gärna din fråga!
              </p>
              
              {/* Quick action to book if no appointment */}
              {!upcomingAppointment && (
                <Button
                  variant="outline"
                  className="mt-6 gap-2"
                  onClick={handleBookingRequest}
                >
                  <Calendar className="w-4 h-4" />
                  Boka möte med dietist
                </Button>
              )}
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
                onBookingRequest={handleBookingRequest}
                attachments={msg.attachments}
                onVisible={
                  msg.sender !== "user" && !msg.id.startsWith("temp-") && !msg.read_at
                    ? () => markAsRead(msg.id)
                    : undefined
                }
              />
            ))
          )}

          {/* AI follow-up after 10 min without dietitian reply */}
          {aiFollowUpShown && (
            <div className="mx-auto max-w-[300px] bg-muted/60 border border-border rounded-2xl p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Bot className="w-4 h-4" />
                <span>{dietitianInfo?.firstName || "Dietisten"} har inte svarat ännu</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Vill du få ett svar från AI-assistenten istället?
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="default" onClick={() => handleAiFollowUp(true)}>
                  Ja, ge mig svar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleAiFollowUp(false)}>
                  Nej tack
                </Button>
              </div>
            </div>
          )
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
          {/* Pending attachments */}
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
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground flex-shrink-0"
              onClick={() => setAttachmentPickerOpen(true)}
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
              disabled={(!inputValue.trim() && pendingAttachments.length === 0) || sending}
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

      {/* Attachment Picker */}
      {user && (
        <ChatAttachmentPicker
          patientId={user.id}
          open={attachmentPickerOpen}
          onOpenChange={setAttachmentPickerOpen}
          onAttach={(att) => setPendingAttachments((prev) => [...prev, att])}
        />
      )}

      {/* Booking Sheet */}
      <ChatBookingSheet
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
        dietitian={dietitianInfo}
      />

      {/* Response Choice Dialog */}
      <ResponseChoiceDialog
        open={choiceDialogOpen}
        onChoice={handleResponseChoice}
        dietitianName={dietitianInfo?.firstName}
      />
    </>
  );
}
