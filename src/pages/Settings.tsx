import { useState, useEffect } from "react";
import { ArrowLeft, User, Bell, Shield, CreditCard, HelpCircle, ChevronRight, BookOpen, Flame, Sparkles, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface NutritionGoals {
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

interface NutritionSettings {
  aiTrackingEnabled: boolean;
  calorieTrackingEnabled: boolean;
}

const settingsSections = [
  {
    title: "Konto",
    items: [
      { icon: User, label: "Personuppgifter", action: "navigate" },
      { icon: Bell, label: "Notifikationer", action: "toggle", key: "notifications", enabled: true },
      { icon: Shield, label: "Sekretess & Säkerhet", action: "navigate" },
    ],
  },
  {
    title: "Betalning",
    items: [
      { icon: CreditCard, label: "Betalningsmetoder", action: "navigate" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Hjälp & Vanliga frågor", action: "navigate" },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  
  // Journal settings state
  const [nutritionSettings, setNutritionSettings] = useState<NutritionSettings>({
    aiTrackingEnabled: false,
    calorieTrackingEnabled: true,
  });
  
  const [goals, setGoals] = useState<NutritionGoals>({
    caloriesGoal: 2000,
    proteinGoal: 50,
    carbsGoal: 250,
    fatGoal: 65,
  });
  
  const [editableGoals, setEditableGoals] = useState<NutritionGoals>(goals);

  // Load settings from localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem("nutrition_settings");
    const storedGoals = localStorage.getItem("nutrition_goals");
    
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      setNutritionSettings({
        aiTrackingEnabled: parsed.aiTrackingEnabled ?? false,
        calorieTrackingEnabled: parsed.calorieTrackingEnabled ?? true,
      });
    }
    
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    }
  }, []);

  const handleToggleAITracking = (enabled: boolean) => {
    const stored = localStorage.getItem("nutrition_settings");
    const current = stored ? JSON.parse(stored) : {};
    const updated = { ...current, aiTrackingEnabled: enabled };
    localStorage.setItem("nutrition_settings", JSON.stringify(updated));
    setNutritionSettings(prev => ({ ...prev, aiTrackingEnabled: enabled }));
  };

  const handleToggleCalorieTracking = (enabled: boolean) => {
    const stored = localStorage.getItem("nutrition_settings");
    const current = stored ? JSON.parse(stored) : {};
    const updated = { ...current, calorieTrackingEnabled: enabled };
    localStorage.setItem("nutrition_settings", JSON.stringify(updated));
    setNutritionSettings(prev => ({ ...prev, calorieTrackingEnabled: enabled }));
  };

  const handleOpenGoalsDialog = () => {
    setEditableGoals(goals);
    setIsGoalsDialogOpen(true);
  };

  const handleSaveGoals = () => {
    setGoals(editableGoals);
    localStorage.setItem("nutrition_goals", JSON.stringify(editableGoals));
    setIsGoalsDialogOpen(false);
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Inställningar</h1>
          <p className="text-sm text-muted-foreground">Hantera ditt konto</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="shadow-soft">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xl font-bold">
            EM
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Erik Magnusson</h3>
            <p className="text-sm text-muted-foreground">erik.magnusson@email.se</p>
          </div>
        </CardContent>
      </Card>

      {/* Journal Settings - FIRST SECTION */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Journal
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-0 divide-y divide-border">
            {/* AI Tracking Toggle */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">AI-näringsspårning</span>
              </div>
              <Switch 
                checked={nutritionSettings.aiTrackingEnabled}
                onCheckedChange={handleToggleAITracking}
              />
            </div>
            
            {/* Calorie Tracking Toggle */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Spåra kalorier</span>
              </div>
              <Switch 
                checked={nutritionSettings.calorieTrackingEnabled}
                onCheckedChange={handleToggleCalorieTracking}
              />
            </div>
            
            {/* Adjust Goals */}
            <div 
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleOpenGoalsDialog}
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-foreground">Justera mål</span>
                  <p className="text-xs text-muted-foreground">Ändra gränser för kalorier, protein, m.m.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Other Settings Sections */}
      {settingsSections.map((section) => (
        <section key={section.title}>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {section.title}
          </h2>
          <Card className="shadow-soft">
            <CardContent className="p-0 divide-y divide-border">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  {item.action === "toggle" ? (
                    <Switch checked={item.enabled} />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ))}

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground">
        EatSuite version 1.0.0
      </p>

      {/* Goals Dialog */}
      <Dialog open={isGoalsDialogOpen} onOpenChange={setIsGoalsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Justera dagliga mål
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Kalorier (kcal)</Label>
              <Input
                id="calories"
                type="number"
                value={editableGoals.caloriesGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  caloriesGoal: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={editableGoals.proteinGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  proteinGoal: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="carbs">Kolhydrater (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={editableGoals.carbsGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  carbsGoal: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fat">Fett (g)</Label>
              <Input
                id="fat"
                type="number"
                value={editableGoals.fatGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  fatGoal: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalsDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveGoals}>
              Spara mål
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
