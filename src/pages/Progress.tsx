import { TrendingUp, Target, Award, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";

const achievements = [
  { title: "7 dagars svit", description: "Du har loggat 7 dagar i rad!", completed: true },
  { title: "Första samtalet", description: "Genomfört ditt första videosamtal", completed: true },
  { title: "Vattenmästare", description: "Nå vattenmålet 5 dagar i rad", completed: false, progress: 60 },
];

export default function Progress() {
  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Din utveckling</h1>
        <p className="text-sm text-muted-foreground">Se hur långt du har kommit</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">14</p>
            <p className="text-xs text-muted-foreground">Aktiva dagar</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">85%</p>
            <p className="text-xs text-muted-foreground">Måluppfyllelse</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Veckoöversikt
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Du är på rätt spår!</span>
            </div>
            <div className="flex justify-between gap-1">
              {["M", "T", "O", "T", "F", "L", "S"].map((day, index) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      index < 5
                        ? "bg-primary text-primary-foreground"
                        : index === 5
                        ? "bg-primary-soft text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Prestationer
        </h2>
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <Card key={achievement.title} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      achievement.completed
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {!achievement.completed && achievement.progress && (
                      <ProgressBar value={achievement.progress} className="h-1.5 mt-2" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
