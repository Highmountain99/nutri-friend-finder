import { useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useAppointments } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  text: string;
  sender: "user" | "dietitian";
  timestamp: Date;
}

export default function Messages() {
  const { getUpcomingAppointment, loading } = useAppointments();
  const upcomingAppointment = getUpcomingAppointment();

  // Get dietitian info from appointment
  const dietitian = upcomingAppointment?.dietitian;
  const dietitianName = dietitian
    ? `${dietitian.firstName} ${dietitian.lastName}`
    : "Din dietist";
  const dietitianTitle = dietitian?.title || "Legitimerad dietist";
  const dietitianAvatar = dietitian?.avatarUrl;
  const dietitianInitials = dietitian
    ? `${dietitian.firstName[0]}${dietitian.lastName[0]}`.toUpperCase()
    : "DD";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hej! Välkommen till EatSuite. Jag är ${dietitian?.firstName || "din dietist"}. Hur kan jag hjälpa dig idag?`,
      sender: "dietitian",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate dietitian response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: "Tack för ditt meddelande! Jag återkommer inom kort med ett svar.",
        sender: "dietitian",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-border bg-card">
        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              {dietitianAvatar ? (
                <AvatarImage
                  src={dietitianAvatar}
                  alt={dietitianName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary-soft text-primary font-semibold text-sm">
                {dietitianInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{dietitianName}</h2>
              <p className="text-xs text-muted-foreground">{dietitianTitle}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5",
                message.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={cn(
                  "text-[10px] mt-1",
                  message.sender === "user"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {format(message.timestamp, "HH:mm", { locale: sv })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv ett meddelande..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} size="icon" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
