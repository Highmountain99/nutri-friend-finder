import { useNavigate } from "react-router-dom";
import { useMyDietitian } from "@/hooks/useMyDietitian";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import dialogBubbles from "@/assets/illustrations/33-dialog-bubbles.jpg";
import studyDesk from "@/assets/illustrations/12-study-desk.jpg";
import cheeringTrio from "@/assets/illustrations/24-cheering-trio.jpg";
import growthArrow from "@/assets/illustrations/39-growth-arrow.jpg";

const quickActions = [
  {
    label: "Chatt",
    text: "Ställ en fråga till din coach",
    illustration: dialogBubbles,
    bg: "bg-leaf",
    to: "/messages",
  },
  {
    label: "Journal",
    text: "Logga dagens måltid",
    illustration: studyDesk,
    bg: "bg-gold",
    to: "/journal",
  },
  {
    label: "Recept",
    text: "Nya förslag till dig",
    illustration: cheeringTrio,
    bg: "bg-apricot",
    to: "/recipes",
  },
  {
    label: "Resan",
    text: "Följ din utveckling",
    illustration: growthArrow,
    bg: "bg-sage",
    to: "/progress",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dietitian, isLoading: dietitianLoading } = useMyDietitian();

  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "du";

  return (
    <div className="pb-8 animate-fade-in">
      {/* Sage header block */}
      <section className="screen-header bg-sage px-5 pt-5 pb-6">
        <h1 className="display text-[34px]">
          Hej {firstName}.{" "}
          <span className="pill-highlight pill-highlight--light">Redo?</span>
        </h1>

        {dietitianLoading ? (
          <Skeleton className="h-14 w-full rounded-card mt-4" />
        ) : dietitian ? (
          <button
            onClick={() => navigate("/messages")}
            className="mt-4 w-full flex items-center gap-3 text-left"
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={dietitian.avatar_url || undefined} />
              <AvatarFallback className="bg-card text-primary font-bold">
                {dietitian.first_name?.[0]}
                {dietitian.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary truncate">
                {dietitian.first_name} {dietitian.last_name}
              </p>
              <p className="text-xs text-primary/65 truncate">
                {dietitian.title || "Din coach"}
              </p>
            </div>
          </button>
        ) : null}
      </section>

      {/* Quick actions */}
      <section className="px-4 pt-6">
        <h2 className="display text-[22px] mb-3">
          Vad vill du <span className="pill-highlight pill-highlight--apricot">göra idag?</span>
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              data-tour={a.to === "/profile" ? "home-health" : undefined}
              className={`${a.bg} rounded-card p-3 text-left flex flex-col justify-between min-h-[168px] transition-transform active:scale-[0.97]`}
            >
              <span className="inline-flex self-start rounded-pill bg-card px-3 py-1 text-[11px] font-bold text-primary">
                {a.label}
              </span>
              <img
                src={a.illustration}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="doodle mx-auto h-16 w-auto object-contain"
              />
              <span className="text-[13px] font-bold text-primary leading-snug">
                {a.text}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Daily thought */}
      <section className="px-4 pt-5">
        <div className="rounded-card bg-primary text-primary-foreground p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70 mb-2">
            Dagens tanke
          </p>
          <p className="text-base leading-snug font-semibold">
            Små steg varje dag leder till stora förändringar. Du gör ett fantastiskt jobb.
          </p>
        </div>
      </section>

      <section className="px-4 pt-4 flex gap-2">
        <button
          data-tour="home-health"
          onClick={() => navigate("/profile")}
          className="flex-1 rounded-pill bg-card py-3 text-sm font-bold text-primary"
        >
          Hälsoprofil
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="flex-1 rounded-pill border-[1.5px] border-primary/60 py-3 text-sm font-bold text-primary"
        >
          Inställningar
        </button>
      </section>
    </div>
  );
}
