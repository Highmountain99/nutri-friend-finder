import { Heart, Check, Circle, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";
import { useNavigate } from "react-router-dom";

interface EatingDisorderProgressProps {
  data: ProgressData;
}

// Affirmations for daily focus
const AFFIRMATIONS = [
  "Lyssna på din kropp och var snäll mot dig själv",
  "Varje måltid är ett steg framåt",
  "Du är värd att ta hand om dig",
  "Framsteg, inte perfektion",
  "Din kropp förtjänar näring och omsorg",
];

// Weekly goals (would come from dietitian in real implementation)
const WEEKLY_GOALS = [
  { id: '1', title: 'Äta frukost varje dag', completed: true },
  { id: '2', title: 'Prova en ny maträtt', completed: false },
  { id: '3', title: 'Äta tillsammans med någon', completed: false },
];

export function EatingDisorderProgress({ data }: EatingDisorderProgressProps) {
  const navigate = useNavigate();
  
  // Get a consistent affirmation for today based on date
  const todayIndex = new Date().getDate() % AFFIRMATIONS.length;
  const todayAffirmation = AFFIRMATIONS[todayIndex];

  // Calculate meal regularity from nutrition entries (without showing calories!)
  const mealsLogged = data.weeklyStats.mealsLogged || 0;
  const daysWithThreeMeals = Math.min(Math.floor(mealsLogged / 3), 7);

  // Mock meal rhythm for today (would come from nutrition_entries)
  const todayMeals = [
    { name: 'Frukost', logged: true },
    { name: 'Lunch', logged: true },
    { name: 'Middag', logged: false },
    { name: 'Mellanmål', logged: false },
  ];

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <ProgressHeader 
        title="Din återhämtning"
        subtitle="En dag i taget"
      />

      {/* Daily Focus - Affirmation */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          💚 Dagens fokus
        </h2>
        <Card className="shadow-soft bg-gradient-to-br from-primary-soft to-background border-primary/20">
          <CardContent className="p-5 text-center">
            <p className="text-lg font-medium text-foreground italic">
              "{todayAffirmation}"
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Meal Rhythm - NO calories shown */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          🍽️ Måltidsrytm idag
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-3">
            {todayMeals.map((meal) => (
              <div key={meal.name} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  meal.logged 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {meal.logged ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </div>
                <span className={`text-sm ${meal.logged ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {meal.name}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* 30-Day Regularity (Heatmap-style, no numbers) */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          📈 Regelbundenhet (30 dagar)
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-3">
              {Array.from({ length: 30 }).map((_, i) => {
                // Random for demo - would be real data
                const hasThreeMeals = Math.random() > 0.2;
                return (
                  <div
                    key={i}
                    className={`w-full aspect-square rounded-sm ${
                      hasThreeMeals 
                        ? 'bg-primary' 
                        : 'bg-muted'
                    }`}
                    title={hasThreeMeals ? '3+ måltider' : 'Färre måltider'}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span className="text-muted-foreground">3+ måltider</span>
              </div>
              <span className="font-medium text-foreground">
                {daysWithThreeMeals}/30 dagar
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Treatment Plan from Dietitian */}
      <TreatmentPlanSection />

      {/* Next Appointment */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          📅 Nästa samtal
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Onsdag 5 feb kl 14:00</p>
                <p className="text-sm text-muted-foreground">Videosamtal med din dietist</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => navigate('/booking')}
              >
                Boka om
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="w-4 h-4" />
                Chatta
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Support Message */}
      <Card className="shadow-soft bg-gradient-to-r from-primary-soft/50 to-accent/10">
        <CardContent className="p-4 text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-foreground">
            Du gör framsteg varje dag. <br />
            Vi finns här för dig. 💚
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
