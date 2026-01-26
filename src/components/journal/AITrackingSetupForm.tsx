import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AITrackingSetupFormProps {
  onComplete: (data: AITrackingFormData) => void;
  onBack: () => void;
}

export interface AITrackingFormData {
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "active" | "very_active";
}

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Stillasittande", description: "Knappt någon fysisk aktivitet" },
  { value: "lightly_active", label: "Lite aktiv", description: "Tränar 1–2 gånger i veckan" },
  { value: "moderately_active", label: "Medel aktiv", description: "Tränar max 3 gånger i veckan" },
  { value: "active", label: "Aktiv", description: "Tränar 4+ gånger i veckan" },
  { value: "very_active", label: "Väldigt aktiv", description: "Tränar 5+ dagar i veckan" },
] as const;

const GENDERS = [
  { value: "male", label: "Man" },
  { value: "female", label: "Kvinna" },
  { value: "other", label: "Annat" },
] as const;

export function AITrackingSetupForm({ onComplete, onBack }: AITrackingSetupFormProps) {
  const [gender, setGender] = useState<AITrackingFormData["gender"]>("male");
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [activityLevel, setActivityLevel] = useState<AITrackingFormData["activityLevel"]>("moderately_active");

  const isValid = heightCm && weightKg && parseFloat(heightCm) > 0 && parseFloat(weightKg) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    onComplete({
      gender,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      activityLevel,
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Näringsspårning
          </h2>
          <p className="text-sm text-muted-foreground">Fyll i din profil för bättre uppskattningar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gender */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kön</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={gender} onValueChange={(v) => setGender(v as AITrackingFormData["gender"])}>
              <div className="flex gap-4">
                {GENDERS.map((g) => (
                  <div key={g.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={g.value} id={g.value} />
                    <Label htmlFor={g.value} className="cursor-pointer">{g.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Height & Weight */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mått</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Längd (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Vikt (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Level */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aktivitetsnivå</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={activityLevel} 
              onValueChange={(v) => setActivityLevel(v as AITrackingFormData["activityLevel"])}
              className="space-y-3"
            >
              {ACTIVITY_LEVELS.map((level) => (
                <div 
                  key={level.value} 
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={level.value} id={level.value} className="mt-0.5" />
                  <Label htmlFor={level.value} className="cursor-pointer flex-1">
                    <span className="font-medium text-foreground">{level.label}</span>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={!isValid}>
          <Sparkles className="w-4 h-4 mr-2" />
          Aktivera AI-spårning
        </Button>
      </form>
    </div>
  );
}
