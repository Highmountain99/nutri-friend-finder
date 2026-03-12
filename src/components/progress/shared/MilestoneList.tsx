import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Check } from "lucide-react";
import { Milestone } from "@/types/progress";

interface MilestoneListProps {
  milestones: Milestone[];
  title?: string;
}

export function MilestoneList({ milestones, title = "Milstolpar" }: MilestoneListProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        {title}
      </h2>
      <div className="space-y-2.5">
        {milestones.map((milestone) => (
          <Card key={milestone.id} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    milestone.completed
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {milestone.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Award className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm ${milestone.completed ? 'text-foreground' : 'text-foreground'}`}>
                    {milestone.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                  {!milestone.completed && milestone.progress !== undefined && (
                    <Progress value={milestone.progress} className="h-1.5 mt-2.5 rounded-full" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
