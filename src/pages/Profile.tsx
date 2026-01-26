import { ArrowLeft, Heart, Activity, Ruler, Scale, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const healthInfo = [
  { icon: Scale, label: "Vikt", value: "72 kg" },
  { icon: Ruler, label: "Längd", value: "175 cm" },
  { icon: Heart, label: "Blodtryck", value: "120/80" },
  { icon: Activity, label: "Aktivitetsnivå", value: "Måttlig" },
];

const conditions = ["IBS", "Glutenintolerans"];
const goals = ["Minska magbesvär", "Mer energi", "Bättre sömn"];

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Min hälsoprofil</h1>
          <p className="text-sm text-muted-foreground">Din hälsoinformation</p>
        </div>
      </div>

      {/* Basic Info */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Grundläggande information
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {healthInfo.map((info) => (
            <Card key={info.label} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <info.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{info.label}</span>
                </div>
                <p className="font-semibold text-foreground">{info.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Conditions */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Diagnoser & tillstånd
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition) => (
                <Badge key={condition} variant="secondary" className="px-3 py-1">
                  {condition}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Goals */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Dina mål
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-2">
            {goals.map((goal) => (
              <div key={goal} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-foreground">{goal}</span>
              </div>
            ))}
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

      {/* Edit Button */}
      <Button variant="outline" className="w-full">
        Redigera hälsoprofil
      </Button>
    </div>
  );
}
