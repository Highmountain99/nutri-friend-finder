import { useNavigate } from "react-router-dom";
import { MessageCircle, User, Settings } from "lucide-react";
import { QuickActionCard } from "@/components/home/QuickActionCard";
import { useMyDietitian } from "@/hooks/useMyDietitian";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const navigate = useNavigate();
  const { data: dietitian, isLoading: dietitianLoading } = useMyDietitian();

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Coach Card */}
      {dietitianLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : dietitian ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={dietitian.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {dietitian.first_name?.[0]}{dietitian.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {dietitian.first_name} {dietitian.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{dietitian.title}</p>
                <p className="text-xs text-primary font-medium mt-0.5">Din coach</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Snabbåtgärder
        </h2>
        <div className="space-y-3">
          <QuickActionCard
            icon={MessageCircle}
            title="Chatta med din dietist"
            description="Skicka ett meddelande när som helst"
            onClick={() => navigate("/messages")}
            variant="accent"
          />
          <div data-tour="home-health">
            <QuickActionCard
              icon={User}
              title="Min hälsoprofil"
              description="Visa hälsoprofil"
              onClick={() => navigate("/profile")}
            />
          </div>
          <QuickActionCard
            icon={Settings}
            title="Profilinställningar"
            description="Uppdatera din information"
            onClick={() => navigate("/settings")}
          />
        </div>
      </section>

      {/* Motivation Section */}
      <section className="pt-2">
        <div className="relative rounded-2xl bg-primary text-primary-foreground p-5 overflow-hidden">
          <span className="absolute top-0 left-5 w-8 h-[3px] rounded-b-[3px] bg-nutrient-carb" />
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase opacity-70 mb-2">
            Dagens tanke
          </p>
          <p className="font-serif italic text-xl leading-snug text-primary-foreground">
            "Små steg varje dag leder till stora förändringar. Du gör ett fantastiskt jobb!"
          </p>
        </div>
      </section>

    </div>
  );
}
