import { useState } from "react";
import { Activity, Ruler, Scale, AlertCircle, Pencil, MessageSquareText, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableHealthCard } from "@/components/profile/EditableHealthCard";
import { EditWeightSheet } from "@/components/profile/EditWeightSheet";
import { EditHeightSheet } from "@/components/profile/EditHeightSheet";
import { EditActivitySheet } from "@/components/profile/EditActivitySheet";
import { EditGoalsSheet } from "@/components/profile/EditGoalsSheet";
import { EditWaistSheet } from "@/components/profile/EditWaistSheet";
import { useHealthProfile, activityLevelLabels } from "@/hooks/useHealthProfile";
import { useIntakeProfile } from "@/hooks/useIntakeProfile";

type EditSheet = "weight" | "height" | "activity" | "goals" | "waist" | null;

export default function Profile() {
  const { data, loading, updateWeight, updateHeight, updateActivityLevel, updateWaist } = useHealthProfile();
  const { profile: intakeProfile, loading: intakeLoading } = useIntakeProfile();
  const [openSheet, setOpenSheet] = useState<EditSheet>(null);

  const formatActivityLevel = () => {
    if (!data.activityLevel) return undefined;
    return activityLevelLabels[data.activityLevel];
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground">Min hälsoprofil</h1>
          <p className="text-sm text-muted-foreground">Din hälsoinformation</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="pb-8 space-y-6 animate-fade-in">
      {/* Header */}
      <section className="screen-header bg-apricot -mx-3 sm:-mx-4 px-4 pt-[calc(env(safe-area-inset-top)+18px)] pb-6">
        <h1 className="display text-[38px] leading-[0.92]">
          Min{" "}
          <span className="pill-highlight pill-highlight--light">
            hälsoprofil
          </span>
        </h1>
        <p className="text-sm font-bold text-primary/70 mt-2">Din hälsoinformation</p>
      </section>

      <div className="px-4 space-y-6">

      {/* Basic Info */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Grundläggande information
        </h2>
        <div data-tour="profile-health" className="grid grid-cols-2 gap-3">
          <EditableHealthCard
            icon={Scale}
            label="Vikt"
            value={data.weightKg ? `${data.weightKg} kg` : undefined}
            onEdit={() => setOpenSheet("weight")}
          />
          <EditableHealthCard
            icon={Ruler}
            label="Längd"
            value={data.heightCm ? `${data.heightCm} cm` : undefined}
            onEdit={() => setOpenSheet("height")}
          />
          <EditableHealthCard
            icon={Activity}
            label="Aktivitetsnivå"
            value={formatActivityLevel()}
            onEdit={() => setOpenSheet("activity")}
          />
          <EditableHealthCard
            icon={Target}
            label="Midjemått"
            value={data.waistCm ? `${data.waistCm} cm` : undefined}
            onEdit={() => setOpenSheet("waist")}
          />
        </div>
      </section>

      {/* Registration free text */}
      {intakeProfile?.aiFreeText && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Från registrering
          </h2>
          <Card className="shadow-soft">
            <CardContent className="p-4 flex gap-3">
              <MessageSquareText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-foreground text-sm whitespace-pre-wrap">{intakeProfile.aiFreeText}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Goals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Dina mål
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setOpenSheet("goals")}
            aria-label="Visa mål"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-2">
            {data.goals.length > 0 ? (
              data.goals.map((goal) => (
                <div key={goal} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground">{goal}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">Inga mål registrerade</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Important Notice */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Din information är skyddad</p>
            <p className="text-muted-foreground">
              All data hanteras enligt GDPR och patientdatalagen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Sheets */}
      <EditWeightSheet
        open={openSheet === "weight"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        currentValue={data.weightKg}
        onSave={updateWeight}
      />
      <EditHeightSheet
        open={openSheet === "height"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        currentValue={data.heightCm}
        onSave={updateHeight}
      />
      <EditActivitySheet
        open={openSheet === "activity"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        currentValue={data.activityLevel}
        onSave={updateActivityLevel}
      />
      <EditGoalsSheet
        open={openSheet === "goals"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        goals={data.goals}
      />
      <EditWaistSheet
        open={openSheet === "waist"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        currentValue={data.waistCm}
        onSave={updateWaist}
      />
      </div>
    </div>
  );
}
