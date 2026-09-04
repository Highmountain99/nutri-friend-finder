import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Salad } from "lucide-react";
import type { ConversationType } from "@/hooks/useChatMessages";

interface ChatHeaderProps {
  loading?: boolean;
  dietitian?: {
    firstName: string;
    lastName: string;
    title: string;
    avatarUrl?: string | null;
  } | null;
  isEscalated?: boolean;
  mode: ConversationType;
  onModeChange: (mode: ConversationType) => void;
}

const SAGE = "#B7C4A9";
const GOLD = "#DCC08A";
const CREAM = "#F5EFE2";
const GREEN = "#1F3A2E";

export function ChatHeader({ loading, dietitian, isEscalated, mode, onModeChange }: ChatHeaderProps) {
  const fullName = dietitian ? `${dietitian.firstName} ${dietitian.lastName}` : "Din coach";
  const coachLabel = dietitian?.firstName || "Coach";
  const initials = dietitian
    ? `${dietitian.firstName[0]}${dietitian.lastName[0]}`
    : "DC";

  const [displayMode, setDisplayMode] = useState(mode);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (mode === displayMode) return;
    setIsFading(true);
    const t = window.setTimeout(() => {
      setDisplayMode(mode);
      setIsFading(false);
    }, 260);
    return () => window.clearTimeout(t);
  }, [mode, displayMode]);

  const isAi = mode === "ai";
  const isAiDisplay = displayMode === "ai";

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{
          color: GREEN,
          borderRadius: "0 0 28px 28px",
          padding: "calc(env(safe-area-inset-top) + 28px) 20px 28px",
          backgroundImage: `linear-gradient(135deg, ${SAGE} 0%, ${GOLD} 50%, ${SAGE} 100%)`,
          backgroundSize: "200% 200%",
          backgroundPosition: isAi ? "100% 100%" : "0% 0%",
          transition: "background-position 1100ms cubic-bezier(0.35, 0, 0.2, 1)",
        }}
      >
        {/* Slow shimmer sweep across the header */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
          style={{
            backgroundImage:
              "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)",
            opacity: isAi ? 1 : 0,
            transition: "opacity 900ms ease",
            animation: "shimmer-sweep 7s ease-in-out infinite",
          }}
        />

        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="w-[52px] h-[52px] rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-3"
            style={{
              opacity: isFading ? 0 : 1,
              filter: isFading ? "blur(6px)" : "blur(0px)",
              transform: isFading ? "translateY(-8px) scale(0.98)" : "translateY(0) scale(1)",
              transition:
                "opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.4,0,0.2,1), filter 260ms ease",
            }}
          >
            {isAiDisplay ? (
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: CREAM, color: GREEN }}
              >
                <Salad className="w-6 h-6" />
              </div>
            ) : (
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
            )}

            <div className="min-w-0 flex-1">
              <h2
                className="font-serif m-0 truncate"
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                  color: GREEN,
                }}
              >
                {isAiDisplay ? "Flora" : dietitian?.firstName || fullName}
              </h2>
              <p style={{ marginTop: 8, fontSize: 13, color: "rgba(31,58,46,0.75)", fontWeight: 600 }}>
                {isAiDisplay ? "din ai-coach, tränad av sveriges dietister" : dietitian?.title || "Din coach"}
              </p>
            </div>

            {/* Small corner toggle */}
            <div
              className="flex items-center p-1 flex-shrink-0 ml-3"
              style={{ backgroundColor: CREAM, borderRadius: 999 }}
            >
              {(
                [
                  { key: "dietitian" as const, label: coachLabel },
                  { key: "ai" as const, label: "Flora" },
                ]
              ).map((tab) => {
                const active = mode === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onModeChange(tab.key)}
                    className="px-3 py-1.5 text-xs font-semibold"
                    style={{
                      borderRadius: 999,
                      backgroundColor: active ? GREEN : "transparent",
                      color: active ? CREAM : GREEN,
                      transition: "all 320ms cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isEscalated && !isAi && (
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
