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

const SAGE = "#8FAF7E";
const CREAM = "#F5EFE2";
const GREEN = "#1F3A2E";

export function ChatHeader({ loading, dietitian, isEscalated }: ChatHeaderProps) {
  const fullName = dietitian
    ? `${dietitian.firstName} ${dietitian.lastName}`
    : "Din coach";
  const title = dietitian?.title || "Din coach";
  const initials = dietitian
    ? `${dietitian.firstName[0]}${dietitian.lastName[0]}`
    : "DC";

  return (
    <div>
      <div
        style={{
          backgroundColor: SAGE,
          color: GREEN,
          borderRadius: "0 0 28px 28px",
          padding: "calc(env(safe-area-inset-top) + 18px) 20px 22px",
        }}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="w-[52px] h-[52px] rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-[52px] h-[52px]">
              {dietitian?.avatarUrl ? (
                <AvatarImage src={dietitian.avatarUrl} alt={fullName} className="object-cover" />
              ) : null}
              <AvatarFallback
                style={{ backgroundColor: CREAM, color: GREEN, fontWeight: 700, fontSize: 16 }}
              >
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2
                className="font-serif m-0 truncate"
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                  color: GREEN,
                }}
              >
                {dietitian?.firstName || fullName}
              </h2>
              <p style={{ marginTop: 6, fontSize: 13, color: "rgba(31,58,46,0.75)", fontWeight: 600 }}>{title}</p>
            </div>
          </div>
        )}
      </div>

      {isEscalated && (
        <div className="px-5 py-2">
          <p className="text-xs text-muted-foreground">
            {dietitian?.firstName || "Din coach"} har kopplats på och återkommer så snart som
            möjligt.
          </p>
        </div>
      )}
    </div>
  );
}
