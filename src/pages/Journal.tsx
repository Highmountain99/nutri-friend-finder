import { useState, useRef } from "react";
import { Flame, Drumstick, Wheat, Droplet, ChevronLeft, ChevronRight, Plus, Camera, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WeekDaySelector } from "@/components/journal/WeekDaySelector";
import { NutritionCard } from "@/components/journal/NutritionCard";
import { AITrackingOnboarding } from "@/components/journal/AITrackingOnboarding";
import { AITrackingSetupForm, AITrackingFormData } from "@/components/journal/AITrackingSetupForm";
import { HealthMetricsView } from "@/components/journal/HealthMetricsView";
import { useJournalData } from "@/hooks/useJournalData";
import { cn } from "@/lib/utils";

type JournalView = "main" | "ai-setup";
type SwipeView = "nutrition" | "health";

export default function Journal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<JournalView>("main");
  const [swipeView, setSwipeView] = useState<SwipeView>("nutrition");
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const {
    isLoading,
    goals,
    dailyTotals,
    settings,
    healthMetrics,
    appleHealthSettings,
    addEntry,
    updateSettings,
    connectAppleHealth,
  } = useJournalData(selectedDate);

  const nutritionCards = [
    {
      icon: Flame,
      label: "Kalorier",
      current: dailyTotals.calories,
      goal: goals.caloriesGoal,
      unit: "kcal",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Drumstick,
      label: "Protein",
      current: Math.round(dailyTotals.protein),
      goal: goals.proteinGoal,
      unit: "g",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Wheat,
      label: "Kolhydrater",
      current: Math.round(dailyTotals.carbs),
      goal: goals.carbsGoal,
      unit: "g",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Droplet,
      label: "Fett",
      current: Math.round(dailyTotals.fat),
      goal: goals.fatGoal,
      unit: "g",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  const handleAISetupComplete = (data: AITrackingFormData) => {
    updateSettings({
      aiTrackingEnabled: true,
      aiTrackingOnboardingCompleted: true,
      gender: data.gender,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      activityLevel: data.activityLevel,
    });
    setView("main");
  };

  const handleSkipAITracking = () => {
    updateSettings({
      aiTrackingOnboardingCompleted: true,
    });
  };

  const handleActivateAITracking = () => {
    setView("ai-setup");
  };

  const handleAddEntry = (entry: {
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isAiEstimated: boolean;
  }) => {
    addEntry(entry);
    setIsPhotoDialogOpen(false);
  };

  // Show AI setup form
  if (view === "ai-setup") {
    return (
      <div className="px-4 py-6 animate-fade-in">
        <AITrackingSetupForm 
          onComplete={handleAISetupComplete}
          onBack={() => setView("main")}
        />
      </div>
    );
  }

  // Show onboarding if not completed
  const showOnboarding = !settings.aiTrackingOnboardingCompleted;

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Din journal</h1>
          <p className="text-sm text-muted-foreground">Håll koll på din dag</p>
        </div>
        <Button size="icon" className="rounded-full">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Week Day Selector */}
      <WeekDaySelector 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
      />

      {/* Swipeable Area Indicator */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setSwipeView("nutrition")}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            swipeView === "nutrition" ? "bg-primary w-4" : "bg-muted-foreground/30"
          )}
        />
        <button
          onClick={() => setSwipeView("health")}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            swipeView === "health" ? "bg-primary w-4" : "bg-muted-foreground/30"
          )}
        />
      </div>

      {/* Swipeable Content Area */}
      <div className="relative overflow-hidden">
        <div
          ref={swipeContainerRef}
          className={cn(
            "flex transition-transform duration-300 ease-out",
            swipeView === "health" && "-translate-x-full"
          )}
        >
          {/* Nutrition View */}
          <div className="w-full flex-shrink-0 space-y-4">
            {showOnboarding ? (
              <AITrackingOnboarding
                onActivate={handleActivateAITracking}
                onSkip={handleSkipAITracking}
              />
            ) : (
              <>
                {/* Nutrition Cards - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {nutritionCards.map((card) => (
                    <NutritionCard key={card.label} {...card} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Health Metrics View */}
          <div className="w-full flex-shrink-0 pl-4">
            <HealthMetricsView
              isConnected={appleHealthSettings.connected}
              steps={healthMetrics.steps}
              activeEnergy={healthMetrics.activeEnergy}
              onConnect={connectAppleHealth}
            />
          </div>
        </div>

        {/* Swipe Navigation Buttons */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          {swipeView === "health" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 shadow-sm"
              onClick={() => setSwipeView("nutrition")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          {swipeView === "nutrition" && !showOnboarding && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 shadow-sm"
              onClick={() => setSwipeView("health")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Section Label */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {swipeView === "nutrition" ? "Näring" : "Hälsomätare"}
        </span>
      </div>

      {/* Fixed Camera Button - Bottom Right */}
      {settings.aiTrackingEnabled && !showOnboarding && (
        <div className="fixed bottom-24 right-4 z-50">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-elevated"
            onClick={() => setIsPhotoDialogOpen(true)}
          >
            <Camera className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Photo Capture Dialog */}
      <FoodPhotoCaptureDialog 
        isOpen={isPhotoDialogOpen}
        onClose={() => setIsPhotoDialogOpen(false)}
        onAddEntry={handleAddEntry}
      />
    </div>
  );
}

// Extracted dialog component for cleaner code
interface FoodPhotoCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: {
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isAiEstimated: boolean;
  }) => void;
}

function FoodPhotoCaptureDialog({ isOpen, onClose, onAddEntry }: FoodPhotoCaptureDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [estimation, setEstimation] = useState<{
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      analyzeImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setEstimation({
      mealName: "Kyckling med ris och grönsaker",
      calories: 450,
      protein: 35,
      carbs: 45,
      fat: 12,
    });
    
    setIsAnalyzing(false);
  };

  const handleConfirm = () => {
    if (!estimation) return;
    
    onAddEntry({
      ...estimation,
      isAiEstimated: true,
    });
    
    handleReset();
  };

  const handleReset = () => {
    setImagePreview(null);
    setEstimation(null);
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            AI Näringsspårning
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Klicka för att ta eller välja ett foto
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Mat" 
                className="w-full h-48 object-cover rounded-xl"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleReset}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm">Analyserar matbilden...</span>
              </CardContent>
            </Card>
          )}

          {estimation && !isAnalyzing && (
            <Card className="shadow-soft">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">AI-uppskattning</Label>
                  <p className="font-medium text-foreground">{estimation.mealName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <span className="text-muted-foreground">Kalorier</span>
                    <p className="font-semibold text-foreground">{estimation.calories} kcal</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <span className="text-muted-foreground">Protein</span>
                    <p className="font-semibold text-foreground">{estimation.protein} g</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <span className="text-muted-foreground">Kolhydrater</span>
                    <p className="font-semibold text-foreground">{estimation.carbs} g</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <span className="text-muted-foreground">Fett</span>
                    <p className="font-semibold text-foreground">{estimation.fat} g</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleClose}>
                    Avbryt
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleConfirm}>
                    <Check className="w-4 h-4" />
                    Lägg till
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
