import { useState, useEffect } from "react";
import { User, Bell, Shield, CreditCard, HelpCircle, ChevronRight, Sparkles, Target, LogOut } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PersonalInfoSheet from "@/components/settings/PersonalInfoSheet";
import { PaymentMethodsSheet } from "@/components/settings/PaymentMethodsSheet";

interface NutritionGoals {
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

interface EditableNutritionGoals {
  caloriesGoal: number | string;
  proteinGoal: number | string;
  carbsGoal: number | string;
  fatGoal: number | string;
}

interface NutritionSettings {
  aiTrackingEnabled: boolean;
  showCalories: boolean;
  showProtein: boolean;
  showCarbs: boolean;
  showFat: boolean;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  
  // Show toast if returning from Stripe after adding a card
  useEffect(() => {
    if (searchParams.get("payment_added") === "true") {
      setIsPaymentMethodsOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Journal settings state
  const [nutritionSettings, setNutritionSettings] = useState<NutritionSettings>({
    aiTrackingEnabled: false,
    showCalories: true,
    showProtein: true,
    showCarbs: true,
    showFat: true,
  });
  
  // Visibility state for dialog
  const [editableVisibility, setEditableVisibility] = useState({
    showCalories: true,
    showProtein: true,
    showCarbs: true,
    showFat: true,
  });
  
  const [goals, setGoals] = useState<NutritionGoals>({
    caloriesGoal: 2000,
    proteinGoal: 50,
    carbsGoal: 250,
    fatGoal: 65,
  });
  
  const [editableGoals, setEditableGoals] = useState<EditableNutritionGoals>(goals);

  // Load settings from Supabase
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Load nutrition settings
        const { data: settingsData } = await supabase
          .from("user_nutrition_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsData) {
          setNutritionSettings({
            aiTrackingEnabled: settingsData.ai_tracking_enabled ?? false,
            showCalories: settingsData.show_calories ?? true,
            showProtein: settingsData.show_protein ?? true,
            showCarbs: settingsData.show_carbs ?? true,
            showFat: settingsData.show_fat ?? true,
          });
        }

        // Load nutrition goals
        const { data: goalsData } = await supabase
          .from("user_nutrition_goals")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (goalsData) {
          setGoals({
            caloriesGoal: goalsData.calories_goal ?? 2000,
            proteinGoal: goalsData.protein_goal ?? 50,
            carbsGoal: goalsData.carbs_goal ?? 250,
            fatGoal: goalsData.fat_goal ?? 65,
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Track if onboarding is completed
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Load onboarding status
  useEffect(() => {
    if (!user) return;
    
    const loadOnboardingStatus = async () => {
      const { data } = await supabase
        .from("user_nutrition_settings")
        .select("ai_tracking_onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setOnboardingCompleted(data.ai_tracking_onboarding_completed ?? false);
      }
    };
    
    loadOnboardingStatus();
  }, [user]);

  const handleToggleAITracking = async (enabled: boolean) => {
    if (!user) return;
    
    // If enabling and onboarding not completed, navigate to Journal to show setup form
    if (enabled && !onboardingCompleted) {
      await supabase.from("user_nutrition_settings").upsert({
        user_id: user.id,
        ai_tracking_enabled: true,
        ai_tracking_onboarding_completed: false,
      });
      navigate("/journal");
      return;
    }
    
    setNutritionSettings(prev => ({ ...prev, aiTrackingEnabled: enabled }));
    
    await supabase.from("user_nutrition_settings").upsert({
      user_id: user.id,
      ai_tracking_enabled: enabled,
    });
  };


  const handleOpenGoalsDialog = () => {
    setEditableGoals(goals);
    setEditableVisibility({
      showCalories: nutritionSettings.showCalories,
      showProtein: nutritionSettings.showProtein,
      showCarbs: nutritionSettings.showCarbs,
      showFat: nutritionSettings.showFat,
    });
    setIsGoalsDialogOpen(true);
  };

  const handleSaveGoals = async () => {
    if (!user) return;
    
    // Convert empty strings to default values for saving
    const finalGoals: NutritionGoals = {
      caloriesGoal: editableGoals.caloriesGoal === "" ? 0 : Number(editableGoals.caloriesGoal),
      proteinGoal: editableGoals.proteinGoal === "" ? 0 : Number(editableGoals.proteinGoal),
      carbsGoal: editableGoals.carbsGoal === "" ? 0 : Number(editableGoals.carbsGoal),
      fatGoal: editableGoals.fatGoal === "" ? 0 : Number(editableGoals.fatGoal),
    };
    
    setGoals(finalGoals);
    setNutritionSettings(prev => ({
      ...prev,
      ...editableVisibility,
    }));
    setIsGoalsDialogOpen(false);
    
    // Update goals (use update instead of upsert to avoid 409 conflicts)
    await supabase.from("user_nutrition_goals")
      .update({
        calories_goal: finalGoals.caloriesGoal,
        protein_goal: finalGoals.proteinGoal,
        carbs_goal: finalGoals.carbsGoal,
        fat_goal: finalGoals.fatGoal,
      })
      .eq("user_id", user.id);
    
    // Update visibility settings
    await supabase.from("user_nutrition_settings")
      .update({
        show_calories: editableVisibility.showCalories,
        show_protein: editableVisibility.showProtein,
        show_carbs: editableVisibility.showCarbs,
        show_fat: editableVisibility.showFat,
      })
      .eq("user_id", user.id);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Profile name state
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileFirstName(data.first_name || "");
          setProfileLastName(data.last_name || "");
        }
      });
  }, [user]);

  const displayName = profileFirstName && profileLastName
    ? `${profileFirstName} ${profileLastName}`
    : user?.email?.split("@")[0] || "Användare";
  const displayEmail = user?.email || "";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Inställningar</h1>
        <p className="text-sm text-muted-foreground">Hantera ditt konto</p>
      </div>

      {/* Profile Card */}
      <Card className="shadow-soft">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xl font-bold">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
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
                disabled={isLoading}
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
                  onClick={() => {
                    if (item.label === "Personuppgifter") setIsPersonalInfoOpen(true);
                    if (item.label === "Betalningsmetoder") setIsPaymentMethodsOpen(true);
                  }}
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

      {/* Sign Out */}
      <section>
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-destructive/10 transition-colors"
              onClick={handleSignOut}
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-destructive" />
                <span className="text-destructive font-medium">Logga ut</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground">
        Gut Feeling version 1.0.0
      </p>

      {/* Personal Info Sheet */}
      <PersonalInfoSheet open={isPersonalInfoOpen} onOpenChange={setIsPersonalInfoOpen} />
      <PaymentMethodsSheet open={isPaymentMethodsOpen} onOpenChange={setIsPaymentMethodsOpen} />

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
            {/* Calories */}
            <div className="space-y-2">
              <Label htmlFor="calories">Kalorier (kcal)</Label>
              <Input
                id="calories"
                type="number"
                value={editableGoals.caloriesGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  caloriesGoal: e.target.value === "" ? "" : parseInt(e.target.value) || 0 
                }))}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visa i journal</span>
                <Switch
                  checked={editableVisibility.showCalories}
                  onCheckedChange={(checked) => setEditableVisibility(prev => ({
                    ...prev,
                    showCalories: checked,
                  }))}
                />
              </div>
            </div>
            
            {/* Protein */}
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={editableGoals.proteinGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  proteinGoal: e.target.value === "" ? "" : parseInt(e.target.value) || 0 
                }))}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visa i journal</span>
                <Switch
                  checked={editableVisibility.showProtein}
                  onCheckedChange={(checked) => setEditableVisibility(prev => ({
                    ...prev,
                    showProtein: checked,
                  }))}
                />
              </div>
            </div>
            
            {/* Carbs */}
            <div className="space-y-2">
              <Label htmlFor="carbs">Kolhydrater (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={editableGoals.carbsGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  carbsGoal: e.target.value === "" ? "" : parseInt(e.target.value) || 0 
                }))}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visa i journal</span>
                <Switch
                  checked={editableVisibility.showCarbs}
                  onCheckedChange={(checked) => setEditableVisibility(prev => ({
                    ...prev,
                    showCarbs: checked,
                  }))}
                />
              </div>
            </div>
            
            {/* Fat */}
            <div className="space-y-2">
              <Label htmlFor="fat">Fett (g)</Label>
              <Input
                id="fat"
                type="number"
                value={editableGoals.fatGoal}
                onChange={(e) => setEditableGoals(prev => ({ 
                  ...prev, 
                  fatGoal: e.target.value === "" ? "" : parseInt(e.target.value) || 0 
                }))}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visa i journal</span>
                <Switch
                  checked={editableVisibility.showFat}
                  onCheckedChange={(checked) => setEditableVisibility(prev => ({
                    ...prev,
                    showFat: checked,
                  }))}
                />
              </div>
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
