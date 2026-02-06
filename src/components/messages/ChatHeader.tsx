import { Bot } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatHeaderProps {
  loading?: boolean;
  dietitian?: {
    firstName: string;
    lastName: string;
    title: string;
    avatarUrl?: string;
  } | null;
  isEscalated?: boolean;
}

export function ChatHeader({ loading, dietitian, isEscalated }: ChatHeaderProps) {
  if (loading) {
    return (
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    );
  }

  // Show AI assistant header by default, or dietitian if escalated
  if (isEscalated && dietitian) {
    return (
      <div className="border-b border-border bg-card">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              {dietitian.avatarUrl ? (
                <AvatarImage
                  src={dietitian.avatarUrl}
                  alt={`${dietitian.firstName} ${dietitian.lastName}`}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary-soft text-primary font-semibold text-sm">
                {dietitian.firstName[0]}
                {dietitian.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">
                {dietitian.firstName} {dietitian.lastName}
              </h2>
              <p className="text-xs text-muted-foreground">{dietitian.title}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-2 bg-warning/10 border-t border-warning/30">
          <p className="text-xs text-warning-foreground">
            Din dietist har kopplats på och återkommer så snart som möjligt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">EatSuite Assistenten</h2>
            <p className="text-xs text-muted-foreground">AI-driven kostrådgivning</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-2 bg-muted/50 border-t border-border">
        <p className="text-xs text-muted-foreground">
          🤖 AI-assistenten hjälper dig snabbt. Din dietist tar vid när det behövs.
        </p>
      </div>
    </div>
  );
}
