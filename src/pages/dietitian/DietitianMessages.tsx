import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { useDietitianChat } from "@/hooks/dietitian/useDietitianChat";
import { useUnreadMessages } from "@/hooks/dietitian/useUnreadMessages";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User, Search, Paperclip, Check, Pencil, X, Bot, ArrowLeft } from "lucide-react";
import { ChatAttachmentPicker, AttachmentPreview } from "@/components/messages/ChatAttachmentPicker";
import { ChatAttachmentDisplay } from "@/components/messages/ChatAttachmentDisplay";
import type { ChatAttachment } from "@/components/messages/ChatAttachmentPicker";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { format, isToday, isYesterday } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const concernLabels: Record<string, string> = {
  weight_loss: "Viktnedgång", diabetes: "Diabetes", gut_health: "Maghälsa / IBS",
  general_health: "Allmän hälsa", womens_health: "Kvinnohälsa",
  emotional_eating: "Emotionellt ätande", eating_disorder: "Ätstörning", heart_health: "Hjärthälsa",
};

function formatDateGroup(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Idag";
  if (isYesterday(d)) return "Igår";
  return format(d, "d MMMM yyyy", { locale: sv });
}

export default function DietitianMessages() {
  const { user } = useAuth();
  const { data: patients, isLoading } = useAssignedPatients();
  const { data: unread } = useUnreadMessages();

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { messages, sendMessage, approveDraft, rejectAndReplace, dismissDraft } = useDietitianChat(selectedPatient ?? undefined);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.data]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!selectedPatient || !messages.data) return;
    const unreadIds = messages.data
      .filter((m) => m.sender !== "dietitian" && !(m as any).read_at)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const { error } = await supabase
        .from("chat_messages")
        .update({ read_at: new Date().toISOString() } as any)
        .in("id", unreadIds);
      if (cancelled || error) return;
      // Nollställ notisbubblan direkt för den här klienten
      queryClient.setQueryData(["unread-messages", user?.id], (prev: any) => {
        if (!prev) return prev;
        const removed = prev.byPatient?.[selectedPatient] ?? 0;
        const byPatient = { ...(prev.byPatient ?? {}) };
        delete byPatient[selectedPatient];
        return { total: Math.max(0, (prev.total ?? 0) - removed), byPatient };
      });
      queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
      queryClient.invalidateQueries({ queryKey: ["dietitian-chat", selectedPatient] });
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPatient, messages.data, queryClient, user?.id]);


  const handleSend = () => {
    if (!input.trim() && pendingAttachments.length === 0) return;
    sendMessage.mutate({ content: input.trim(), attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined });
    setInput("");
    setPendingAttachments([]);
  };

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchQuery) return patients;
    return patients.filter((p) => {
      const q = searchQuery.toLowerCase();
      return p.patient_id.toLowerCase().includes(q) || getPatientDisplayName(p).toLowerCase().includes(q);
    });
  }, [patients, searchQuery]);

  // Sort by unread count desc
  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      const ua = unread?.byPatient[a.patient_id] ?? 0;
      const ub = unread?.byPatient[b.patient_id] ?? 0;
      return ub - ua;
    });
  }, [filteredPatients, unread]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!messages.data) return [];
    const groups: { date: string; messages: typeof messages.data }[] = [];
    let currentDate = "";
    messages.data.forEach((m) => {
      const d = format(new Date(m.created_at), "yyyy-MM-dd");
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: m.created_at, messages: [m] });
      } else {
        groups[groups.length - 1].messages.push(m);
      }
    });
    return groups;
  }, [messages.data]);

  const selectedPatientData = patients?.find((p) => p.patient_id === selectedPatient);
  const selectedConcern = selectedPatientData?.intake_profile?.primary_concern_category;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col max-w-6xl h-full min-h-0">
      <h1 className="text-2xl font-bold text-foreground shrink-0 pb-4">Meddelanden</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-0 flex-1 min-h-0 border rounded-xl overflow-hidden">
        {/* Left: conversation list — hidden on mobile when a chat is open */}
        <div className={`border-r bg-background flex-col min-h-0 ${selectedPatient ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök klient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {sortedPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Inga klienter.</p>
            ) : (
              sortedPatients.map((p) => {
                const unreadCount = unread?.byPatient[p.patient_id] ?? 0;
                return (
                  <button
                    key={p.patient_id}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 ${
                      selectedPatient === p.patient_id ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedPatient(p.patient_id)}
                  >
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{getPatientDisplayName(p)}</span>
                        {unreadCount > 0 && (
                          <span className="h-5 min-w-[20px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {p.intake_profile?.primary_concern_category && (
                        <p className="text-xs text-muted-foreground truncate">
                          {concernLabels[p.intake_profile.primary_concern_category] ?? p.intake_profile.primary_concern_category}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: active conversation — hidden on mobile until a chat is open */}
        <div className={`flex-col bg-background min-h-0 ${selectedPatient ? "flex" : "hidden lg:flex"}`}>
          {!selectedPatient ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Välj en patient för att öppna chatten.
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden -ml-2 h-8 w-8"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-sm">{selectedPatientData ? getPatientDisplayName(selectedPatientData) : `Klient ${selectedPatient.slice(0, 8)}`}</span>
                  {selectedConcern && (
                    <Badge variant="secondary" className="text-xs">{concernLabels[selectedConcern] ?? selectedConcern}</Badge>
                  )}
                </div>
                <Link to={`/dietitian/patients/${selectedPatient}`}>
                  <Button variant="outline" size="sm">Visa profil</Button>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 my-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">{formatDateGroup(group.date)}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    {group.messages.filter((m) => (m as any).status !== 'rejected').map((m) => {
                      const isDraft = (m as any).status === 'draft';
                      const isEditing = editingDraftId === m.id;

                      if (isDraft) {
                        return (
                          <div key={m.id} className="mb-3 mx-auto max-w-[85%]">
                            <div className="border border-dashed border-primary/40 rounded-xl p-3 bg-primary/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                                  <Bot className="h-3.5 w-3.5" />
                                  AI-förslag till svar
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => dismissDraft.mutate(m.id)}
                                  disabled={dismissDraft.isPending}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              {isEditing ? (
                                <>
                                  <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    rows={4}
                                    className="text-sm"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingDraftId(null)}>
                                      <X className="h-3.5 w-3.5 mr-1" /> Avbryt
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        rejectAndReplace.mutate({ draftId: m.id, newContent: editedContent });
                                        setEditingDraftId(null);
                                      }}
                                      disabled={!editedContent.trim() || rejectAndReplace.isPending}
                                    >
                                      <Send className="h-3.5 w-3.5 mr-1" /> Skicka
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-foreground whitespace-pre-wrap">{m.content}</p>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => { setEditingDraftId(m.id); setEditedContent(m.content); }}
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-1" /> Redigera & skicka
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => approveDraft.mutate(m.id)}
                                      disabled={approveDraft.isPending}
                                    >
                                      <Check className="h-3.5 w-3.5 mr-1" /> Godkänn & skicka
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={m.id} className={`flex mb-2 ${m.sender === "dietitian" ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[75%]">
                            <div className={`px-3 py-2 rounded-xl text-sm ${
                              m.sender === "dietitian" ? "bg-primary text-primary-foreground"
                                : m.sender === "ai" ? "bg-muted text-muted-foreground italic"
                                : "bg-secondary text-secondary-foreground"
                            }`}>
                              {m.content}
                              {(m as any).attachments && (m as any).attachments.length > 0 && (
                                <ChatAttachmentDisplay
                                  attachments={(m as any).attachments as ChatAttachment[]}
                                  senderLabel={m.sender === "ai" ? "Kostcoachen" : "Du"}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 px-1">
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(m.created_at), "HH:mm")}
                              </span>
                              {m.sender === "dietitian" && (m as any).read_at && (
                                <span className="text-[10px] text-primary">
                                  Läst {format(new Date((m as any).read_at), "HH:mm")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t space-y-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {pendingAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((att, i) => (
                      <AttachmentPreview
                        key={i}
                        attachment={att}
                        onRemove={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => setAttachmentPickerOpen(true)}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending || (!input.trim() && pendingAttachments.length === 0)} className="bg-primary hover:bg-primary/90 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Attachment picker */}
              {selectedPatient && (
                <ChatAttachmentPicker
                  patientId={selectedPatient}
                  open={attachmentPickerOpen}
                  onOpenChange={setAttachmentPickerOpen}
                  onAttach={(att) => setPendingAttachments((prev) => [...prev, att])}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
