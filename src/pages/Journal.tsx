import { useState, useRef } from "react";
import { Flame, Drumstick, Wheat, Droplet, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekDaySelector } from "@/components/journal/WeekDaySelector";
import { NutritionCard } from "@/components/journal/NutritionCard";
import { AITrackingOnboarding } from "@/components/journal/AITrackingOnboarding";
import { AITrackingSetupForm, AITrackingFormData } from "@/components/journal/AITrackingSetupForm";
import { HealthMetricsView } from "@/components/journal/HealthMetricsView";
import { FoodPhotoCapture } from "@/components/journal/FoodPhotoCapture";
import { useJournalData } from "@/hooks/useJournalData";
import { cn } from "@/lib/utils";

type JournalView = "main" | "ai-setup";
type SwipeView = "nutrition" | "health";

export default function Journal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<JournalView>("main");
  const [swipeView, setSwipeView] = useState<SwipeView>("nutrition");
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
    <div className="px-4 py-6 space-y-6 animate-fade-in">
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
                {/* AI Food Capture Button */}
                {settings.aiTrackingEnabled && (
                  <FoodPhotoCapture onAddEntry={handleAddEntry} />
                )}

                {/* Nutrition Cards */}
                <div className="space-y-3">
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
    </div>
  );
}
