import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyDietitian } from "@/hooks/useMyDietitian";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import { EditWeightSheet } from "@/components/profile/EditWeightSheet";
import { EditWaistSheet } from "@/components/profile/EditWaistSheet";
import { Scale, Ruler } from "lucide-react";
import dialogBubbles from "@/assets/illustrations/33-dialog-bubbles.jpg";
import studyDesk from "@/assets/illustrations/12-study-desk.jpg";
import cheeringTrio from "@/assets/illustrations/24-cheering-trio.jpg";
import growthArrow from "@/assets/illustrations/39-growth-arrow.jpg";

function mealLabelForNow(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 10) return "Logga frukost";
  if (h >= 10 && h < 14) return "Logga lunch";
  if (h >= 14 && h < 17) return "Logga mellanmål";
  return "Logga middag";
}

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
    text: "",
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
  const { data: health, updateWeight, updateWaist } = useHealthProfile();
  const [weightOpen, setWeightOpen] = useState(false);
  const [waistOpen, setWaistOpen] = useState(false);

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
                {a.to === "/journal" ? mealLabelForNow() : a.text}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Snabbuppdatering av mätvärden */}
      <section className="px-4 pt-5">
        <h2 className="display text-[22px] mb-3">Snabbuppdatering</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setWeightOpen(true)}
            className="rounded-card bg-card p-4 text-left transition-transform active:scale-[0.97]"
          >
            <Scale className="h-5 w-5 text-primary mb-2" aria-hidden="true" />
            <span className="block text-[13px] font-bold text-primary">Uppdatera vikt</span>
            <span className="block text-xs text-primary/60 mt-0.5">Tryck för att uppdatera</span>
          </button>
          <button
            onClick={() => setWaistOpen(true)}
            className="rounded-card bg-card p-4 text-left transition-transform active:scale-[0.97]"
          >
            <Ruler className="h-5 w-5 text-primary mb-2" aria-hidden="true" />
            <span className="block text-[13px] font-bold text-primary">Uppdatera midjemått</span>
            <span className="block text-xs text-primary/60 mt-0.5">Tryck för att uppdatera</span>
          </button>
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

      <EditWeightSheet
        key={`weight-${health?.weightKg ?? "none"}`}
        open={weightOpen}
        onOpenChange={setWeightOpen}
        currentValue={health?.weightKg}
        onSave={updateWeight}
      />
      <EditWaistSheet
        key={`waist-${health?.waistCm ?? "none"}`}
        open={waistOpen}
        onOpenChange={setWaistOpen}
        currentValue={health?.waistCm}
        onSave={updateWaist}
      />
    </div>
  );
}
