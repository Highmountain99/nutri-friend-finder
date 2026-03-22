import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressData } from "@/types/progress";
import { ProgressHeader } from "./shared/ProgressHeader";
import { TreatmentPlanSection } from "./shared/TreatmentPlanSection";
import { useEatingDisorderBlocks } from "@/hooks/useEatingDisorderBlocks";
import { useAuth } from "@/contexts/AuthContext";
import {
  FocusBlock,
  MealRhythmBlock,
  MealStructureBlock,
  RegularityGridBlock,
  BehaviorGoalsBlock,
  SymptomPatternBlock,
  WeeklyCheckinBlock,
  FollowUpBlock,
} from "./shared/EDBlockCards";

interface EatingDisorderProgressProps {
  data: ProgressData;
  show: (section: string) => boolean;
}

export function EatingDisorderProgress({ data, show }: EatingDisorderProgressProps) {
  const { user } = useAuth();
  const {
    mealRhythm,
    regularityGrid,
    daysWithThreePlus,
    mealStructure,
    weeklyCheckin,
    symptomPatterns,
    nextAppointment,
    activePlan,
  } = useEatingDisorderBlocks(user?.id);

  return (
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-24">
      <ProgressHeader title="Din återhämtning" subtitle="En dag i taget" />

      {show("ed_focus") && (
        <FocusBlock
          title={activePlan?.description || undefined}
        />
      )}

      {show("ed_meal_rhythm") && <MealRhythmBlock rhythm={mealRhythm} />}

      {show("ed_meal_structure") && (
        <MealStructureBlock label={mealStructure.label} avgMeals={mealStructure.avgMeals} />
      )}

      {show("ed_regularity_30d") && (
        <RegularityGridBlock grid={regularityGrid} daysWithThreePlus={daysWithThreePlus} />
      )}

      {show("ed_behavior_goals") && activePlan?.milestones && (
        <BehaviorGoalsBlock milestones={activePlan.milestones} />
      )}

      {show("ed_symptom_patterns") && symptomPatterns.length > 0 && (
        <SymptomPatternBlock patterns={symptomPatterns} />
      )}

      {show("ed_weekly_checkin") && <WeeklyCheckinBlock checkin={weeklyCheckin} />}

      {show("treatment_plan") && <TreatmentPlanSection />}

      {show("ed_follow_up") && <FollowUpBlock appointment={nextAppointment} />}

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
