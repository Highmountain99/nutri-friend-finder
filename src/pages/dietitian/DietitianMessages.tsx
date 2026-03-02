import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { useDietitianChat } from "@/hooks/dietitian/useDietitianChat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function DietitianMessages() {
  const { data: patients, isLoading } = useAssignedPatients();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { messages, sendMessage } = useDietitianChat(selectedPatient ?? undefined);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate(input.trim());
    setInput("");
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground">Meddelanden</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Patient list */}
        <Card className="lg:col-span-1 overflow-auto">
          <CardContent className="p-2 space-y-1">
            {!patients?.length ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Inga patienter.</p>
            ) : (
              patients.map((p) => (
                <button
                  key={p.patient_id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedPatient === p.patient_id ? "bg-primary-soft" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedPatient(p.patient_id)}
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Patient {p.patient_id.slice(0, 8)}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2 flex flex-col">
          {!selectedPatient ? (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Välj en patient för att öppna chatten.
            </CardContent>
          ) : (
            <>
              <CardContent className="flex-1 overflow-auto py-4 space-y-3">
                {messages.data?.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "dietitian" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      m.sender === "dietitian"
                        ? "bg-primary text-primary-foreground"
                        : m.sender === "ai"
                        ? "bg-muted text-muted-foreground italic"
                        : "bg-secondary text-secondary-foreground"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </CardContent>
              <div className="p-3 border-t flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Skriv ett meddelande..."
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
