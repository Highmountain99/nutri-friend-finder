import { Bot } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  sender: "user" | "ai" | "dietitian";
  content: string;
  timestamp: string | Date;
  dietitian?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  } | null;
  escalated?: boolean;
}

export function ChatMessage({
  sender,
  content,
  timestamp,
  dietitian,
  escalated,
}: ChatMessageProps) {
  const isUser = sender === "user";
  const isAi = sender === "ai";
  const isDietitian = sender === "dietitian";

  const time = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar for non-user messages */}
      {!isUser && (
        <div className="flex-shrink-0">
          {isAi ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
          ) : isDietitian && dietitian ? (
            <Avatar className="w-8 h-8">
              {dietitian.avatarUrl ? (
                <AvatarImage
                  src={dietitian.avatarUrl}
                  alt={`${dietitian.firstName} ${dietitian.lastName}`}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary-soft text-primary text-xs">
                {dietitian.firstName[0]}
                {dietitian.lastName[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">?</span>
            </div>
          )}
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        {/* Escalation badge */}
        {escalated && isAi && (
          <div className="flex items-center gap-1 text-xs text-warning-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-warning" />
            Dietist kontaktad
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isAi
              ? "bg-muted text-foreground rounded-bl-md"
              : "bg-accent text-accent-foreground rounded-bl-md border border-primary/20"
          )}
        >
          {isAi ? (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {/* Timestamp */}
        <p
          className={cn(
            "text-[10px] px-1",
            isUser ? "text-right text-muted-foreground" : "text-muted-foreground"
          )}
        >
          {format(time, "HH:mm", { locale: sv })}
        </p>
      </div>
    </div>
  );
}
