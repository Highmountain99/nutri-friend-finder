import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatHeaderProps {
  loading?: boolean;
  dietitian?: {
    firstName: string;
    lastName: string;
    title: string;
    avatarUrl?: string | null;
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

  const fullName = dietitian
    ? `${dietitian.firstName} ${dietitian.lastName}`
    : "Din dietist";
  const title = dietitian?.title || "Legitimerad dietist";
  const initials = dietitian
    ? `${dietitian.firstName[0]}${dietitian.lastName[0]}`
    : "DD";

  return (
    <div className="border-b border-border bg-card">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            {dietitian?.avatarUrl ? (
              <AvatarImage
                src={dietitian.avatarUrl}
                alt={fullName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">{fullName}</h2>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </div>
      
      {/* Only show escalation notice if actually escalated */}
      {isEscalated && (
        <div className="px-4 py-2 bg-primary/5 border-t border-primary/10">
          <p className="text-xs text-muted-foreground">
            {dietitian?.firstName || "Din dietist"} har kopplats på och återkommer så snart som möjligt.
          </p>
        </div>
      )}
    </div>
  );
}
