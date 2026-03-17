import { useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { Calendar } from "lucide-react";
import { ChatAttachmentDisplay } from "./ChatAttachmentDisplay";
import type { ChatAttachment } from "./ChatAttachmentPicker";

interface ChatMessageProps {
  sender: "user" | "ai" | "dietitian";
  content: string;
  timestamp: string | Date;
  dietitian?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  escalated?: boolean;
  onBookingRequest?: () => void;
  attachments?: ChatAttachment[];
  onVisible?: () => void;
}

export function ChatMessage({
  sender,
  content,
  timestamp,
  dietitian,
  escalated,
  onBookingRequest,
  attachments,
  onVisible,
}: ChatMessageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onVisible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onVisible]);
  const isUser = sender === "user";

  const time = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  
  const initials = dietitian
    ? `${dietitian.firstName[0]}${dietitian.lastName[0]}`
    : "DD";

  return (
    <div ref={ref} className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar for non-user messages – always show dietitian avatar */}
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          {dietitian?.avatarUrl ? (
            <AvatarImage
              src={dietitian.avatarUrl}
              alt={`${dietitian.firstName} ${dietitian.lastName}`}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {!isUser ? (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          )}
          {attachments && attachments.length > 0 && (
            <ChatAttachmentDisplay attachments={attachments} />
          )}
        </div>

        {/* Booking CTA for escalated messages */}
        {escalated && !isUser && onBookingRequest && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBookingRequest}
            className="mt-2 gap-2"
          >
            <Calendar className="w-4 h-4" />
            Boka möte
          </Button>
        )}

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

      {/* User avatar placeholder on the right */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-secondary-foreground">Du</span>
        </div>
      )}
    </div>
  );
}
