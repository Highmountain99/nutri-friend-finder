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
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="space-y-3">
        {milestones.map((milestone) => (
          <Card key={milestone.id} className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    milestone.completed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {milestone.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Award className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  {!milestone.completed && milestone.progress !== undefined && (
                    <Progress value={milestone.progress} className="h-1.5 mt-2" />
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
