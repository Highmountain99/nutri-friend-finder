import { Heart, Check, Circle, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";
import { useNavigate } from "react-router-dom";

interface EatingDisorderProgressProps {
  data: ProgressData;
  show: (section: string) => boolean;
}

const AFFIRMATIONS = [
  "Lyssna på din kropp och var snäll mot dig själv",
  "Varje måltid är ett steg framåt",
  "Du är värd att ta hand om dig",
  "Framsteg, inte perfektion",
  "Din kropp förtjänar näring och omsorg",
];

const WEEKLY_GOALS = [
  { id: '1', title: 'Äta frukost varje dag', completed: true },
  { id: '2', title: 'Prova en ny maträtt', completed: false },
  { id: '3', title: 'Äta tillsammans med någon', completed: false },
];

export function EatingDisorderProgress({ data, show }: EatingDisorderProgressProps) {
  const navigate = useNavigate();
  
  const todayIndex = new Date().getDate() % AFFIRMATIONS.length;
  const todayAffirmation = AFFIRMATIONS[todayIndex];

  const mealsLogged = data.weeklyStats.mealsLogged || 0;
  const daysWithThreeMeals = Math.min(Math.floor(mealsLogged / 3), 7);

  const todayMeals = [
    { name: 'Frukost', logged: true },
    { name: 'Lunch', logged: true },
    { name: 'Middag', logged: false },
    { name: 'Mellanmål', logged: false },
  ];

  return (
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-24">
      <ProgressHeader 
        title="Din återhämtning"
        subtitle="En dag i taget"
      />

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          💚 Dagens fokus
        </h2>
        <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold text-foreground italic leading-relaxed">
              "{todayAffirmation}"
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          🍽️ Måltidsrytm idag
        </h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 space-y-3">
            {todayMeals.map((meal) => (
              <div key={meal.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  meal.logged 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-muted/60 text-muted-foreground'
                }`}>
                  {meal.logged ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </div>
                <span className={`text-sm font-medium ${meal.logged ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {meal.name}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          📈 Regelbundenhet (30 dagar)
        </h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {Array.from({ length: 30 }).map((_, i) => {
                const hasThreeMeals = Math.random() > 0.2;
                return (
                  <div
                    key={i}
                    className={`w-full aspect-square rounded-md ${
                      hasThreeMeals 
                        ? 'bg-primary/80' 
                        : 'bg-muted/50'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary/80" />
                <span className="text-muted-foreground text-xs">3+ måltider</span>
              </div>
              <span className="font-semibold text-foreground">
                {daysWithThreeMeals}/30 dagar
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {show('treatment_plan') && <TreatmentPlanSection />}

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          📅 Nästa samtal
        </h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Onsdag 5 feb kl 14:00</p>
                <p className="text-sm text-muted-foreground">Videosamtal med din dietist</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 rounded-full border-border/60 font-medium"
                onClick={() => navigate('/booking')}
              >
                Boka om
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2 rounded-full border-border/60 font-medium"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="w-4 h-4" />
                Chatta
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            Du gör framsteg varje dag. <br />
            Vi finns här för dig. 💚
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
