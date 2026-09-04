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

const SAGE = "#82A570";
const GOLD = "#DCC08A";
const CREAM = "#F5EFE2";
const GREEN = "#1F3A2E";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function ChatHeader({ loading, dietitian, isEscalated, mode, onModeChange }: ChatHeaderProps) {
  const fullName = dietitian ? `${dietitian.firstName} ${dietitian.lastName}` : "Din coach";
  const coachLabel = dietitian?.firstName || "Coach";
  const initials = dietitian ? `${dietitian.firstName[0]}${dietitian.lastName[0]}` : "DC";

  const isAi = mode === "ai";

  const coachName = (dietitian?.firstName || fullName).toUpperCase();
  const coachSub = dietitian?.title || "Din coach";
  const aiSub = "din ai-coach, tränad av sveriges dietister";

  // Wheel: two faces on a rotating cylinder (X axis)
  const wheelFace = (content: React.ReactNode, top: boolean, key: string) => (
    <div
      key={key}
      className="absolute inset-0 flex flex-col justify-center"
      style={{
        backfaceVisibility: "hidden",
        transform: `rotateX(${top ? 0 : -90}deg) translateZ(28px)`,
      }}
    >
      {content}
    </div>
  );

  const nameBlock = (name: string, sub: string) => (
    <>
      <h2
        className="font-serif m-0 truncate"
        style={{
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 0.95,
          textTransform: "uppercase",
          color: GREEN,
        }}
      >
        {name}
      </h2>
      <p
        style={{
          marginTop: 5,
          fontSize: 11.5,
          lineHeight: 1.25,
          color: "rgba(31,58,46,0.75)",
          fontWeight: 600,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {sub}
      </p>
    </>
  );

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{
          color: GREEN,
          borderRadius: "0 0 28px 28px",
          padding: "calc(env(safe-area-inset-top) + 28px) 20px 28px",
          backgroundColor: SAGE,
        }}
      >
        {/* One wide gradient that slides sideways — same direction as the toggle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0"
          style={{
            left: 0,
            width: "200%",
            backgroundImage: `linear-gradient(100deg, ${SAGE} 0%, #9BB98A 30%, #C9BE96 52%, #D6AB7B 72%, ${GOLD} 100%)`,
            transform: isAi ? "translateX(-50%)" : "translateX(0%)",
            transition: `transform 760ms ${EASE}`,
          }}
        />

        {loading ? (
          <div className="relative flex items-center gap-3">
            <Skeleton className="w-[46px] h-[46px] rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-3">
            {/* Avatar: rotates inside its circle */}
            <div
              className="relative w-[46px] h-[46px] rounded-full overflow-hidden flex-shrink-0"
              style={{ backgroundColor: CREAM }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: isAi ? "rotate(180deg)" : "rotate(0deg)",
                  transition: `transform 760ms ${EASE}`,
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    opacity: isAi ? 0 : 1,
                    transition: `opacity 380ms ${EASE}`,
                  }}
                >
                  <Avatar className="w-[46px] h-[46px]">
                    {dietitian?.avatarUrl ? (
                      <AvatarImage src={dietitian.avatarUrl} alt={fullName} className="object-cover" />
                    ) : null}
                    <AvatarFallback
                      style={{ backgroundColor: CREAM, color: GREEN, fontWeight: 700, fontSize: 16 }}
                    >
                      {initials.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    color: GREEN,
                    opacity: isAi ? 1 : 0,
                    transform: "rotate(180deg)",
                    transition: `opacity 380ms ${EASE}`,
                  }}
                >
                  <Salad className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Name + subtitle on a rotating wheel */}
            <div
              className="min-w-0 flex-1 relative"
              style={{ height: 56, perspective: 700 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${isAi ? 90 : 0}deg)`,
                  transition: `transform 760ms ${EASE}`,
                }}
              >
                {wheelFace(nameBlock(coachName, coachSub), true, "coach")}
                {wheelFace(nameBlock("FLORA", aiSub), false, "ai")}
              </div>
            </div>

            {/* Sliding toggle */}
            <div
              className="relative flex items-center flex-shrink-0 ml-2 p-[3px]"
              style={{ backgroundColor: CREAM, borderRadius: 999 }}
            >
              <div
                aria-hidden
                className="absolute top-1 bottom-1"
                style={{
                  left: 3,
                  width: "calc(50% - 3px)",
                  backgroundColor: GREEN,
                  borderRadius: 999,
                  transform: isAi ? "translateX(100%)" : "translateX(0%)",
                  transition: `transform 760ms ${EASE}`,
                }}
              />
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
                    className="relative px-2.5 py-1 text-[11px] font-semibold text-center"
                    style={{
                      minWidth: 46,
                      color: active ? CREAM : GREEN,
                      transition: "color 380ms ease",
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
