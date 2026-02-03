import { ArrowLeft, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DietitianSelectionStepProps {
  onBack: () => void;
  onRecommend: () => void;
  onShowAll: () => void;
}

export function DietitianSelectionStep({
  onBack,
  onRecommend,
  onShowAll,
}: DietitianSelectionStepProps) {
  return (
    <div className="px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Hitta din dietist</h1>
          <p className="text-sm text-muted-foreground">Välj hur du vill hitta din dietist</p>
        </div>
      </div>

      {/* Illustration Placeholder */}
      <div className="flex justify-center mb-8">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Låt oss hitta din dietist!
        </h2>
        <p className="text-muted-foreground">
          Vi matchar dig med en specialist som passar dina behov
        </p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <Card 
          className="shadow-soft cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20"
          onClick={onRecommend}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Hjälp mig välja</h3>
              <p className="text-sm text-muted-foreground">
                Vi rekommenderar dietister baserat på dina behov
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-soft cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20"
          onClick={onShowAll}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Visa alla dietister</h3>
              <p className="text-sm text-muted-foreground">
                Bläddra bland alla våra tillgängliga dietister
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
