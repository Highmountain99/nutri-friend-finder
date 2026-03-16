import { Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AITrackingOnboardingProps {
  onActivate: () => void;
  onSkip: () => void;
}

export function AITrackingOnboarding({ onActivate, onSkip }: AITrackingOnboardingProps) {
  return (
    <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary-soft to-background">
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Vill du ha personliga näringsmål?
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Baserat på din längd, vikt och aktivitetsnivå beräknar vi ett dagligt intag av kalorier, protein, kolhydrater och fett som passar dig.
          </p>
        </div>
        
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={onSkip}>
            Inte nu
          </Button>
          <Button onClick={onActivate} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Aktivera
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
