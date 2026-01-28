import { useState, useRef } from "react";
import { Flame, Drumstick, Wheat, Droplet, ChevronLeft, ChevronRight, Plus, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekDaySelector } from "@/components/journal/WeekDaySelector";
import { NutritionProgressCard } from "@/components/journal/NutritionProgressCard";
import { AITrackingOnboarding } from "@/components/journal/AITrackingOnboarding";
import { AITrackingSetupForm, AITrackingFormData } from "@/components/journal/AITrackingSetupForm";
import { HealthMetricsView } from "@/components/journal/HealthMetricsView";
import { MealTimeline } from "@/components/journal/MealTimeline";
import { AddMealSheet } from "@/components/journal/AddMealSheet";
import { useJournalData, type Ingredient } from "@/hooks/useJournalData";
import { cn } from "@/lib/utils";

type JournalView = "main" | "ai-setup";
type SwipeView = "nutrition" | "health";

export default function Journal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<JournalView>("main");
  const [swipeView, setSwipeView] = useState<SwipeView>("nutrition");
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const {
    isLoading,
    goals,
    dailyTotals,
    entries,
    settings,
    healthMetrics,
    appleHealthSettings,
    addEntry,
    updateSettings,
    connectAppleHealth,
  } = useJournalData(selectedDate);

  // Calculate remaining macros
  const remaining = {
    calories: goals.caloriesGoal - dailyTotals.calories,
    protein: goals.proteinGoal - dailyTotals.protein,
    carbs: goals.carbsGoal - dailyTotals.carbs,
    fat: goals.fatGoal - dailyTotals.fat,
  };

  const nutritionCards = [
    {
      icon: Flame,
      label: "Kalorier",
      remaining: remaining.calories,
      goal: goals.caloriesGoal,
      unit: "kcal",
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      icon: Drumstick,
      label: "Protein",
      remaining: Math.round(remaining.protein),
      goal: goals.proteinGoal,
      unit: "g",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Wheat,
      label: "Kolhydrater",
      remaining: Math.round(remaining.carbs),
      goal: goals.carbsGoal,
      unit: "g",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Droplet,
      label: "Fett",
      remaining: Math.round(remaining.fat),
      goal: goals.fatGoal,
      unit: "g",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
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
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isAiEstimated: boolean;
    imageUrl?: string;
    ingredients?: Ingredient[];
  }) => {
    addEntry({
      mealName: entry.mealName,
      mealType: entry.mealType,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      isAiEstimated: entry.isAiEstimated,
      imageUrl: entry.imageUrl,
      ingredients: entry.ingredients,
    });
    setIsAddMealOpen(false);
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
    <div className="px-4 py-6 space-y-6 animate-fade-in pb-32">
      {/* Week Day Selector */}
      <WeekDaySelector 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
      />

      {/* Streak indicator (placeholder) */}
      <div className="bg-accent/10 py-2 px-4 rounded-full text-center">
        <span className="text-sm text-accent font-medium">🔥 1-dagarsstreak!</span>
      </div>

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
                {/* Nutrition Cards - 2x2 Grid showing "remaining" */}
                <div className="grid grid-cols-2 gap-3">
                  {nutritionCards.map((card) => (
                    <NutritionProgressCard key={card.label} {...card} />
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

      {/* Add Meal Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          onClick={() => setIsAddMealOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Lägg till måltid
        </Button>
      </div>

      {/* Meal Timeline */}
      <div className="space-y-3">
        <MealTimeline 
          entries={entries}
          onEntryClick={(entry) => {
            // TODO: Open entry detail view
            console.log("Entry clicked:", entry);
          }}
        />
      </div>

      {/* Fixed Camera FAB - Always visible */}
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-elevated bg-accent hover:bg-accent/90 relative"
          onClick={() => setIsAddMealOpen(true)}
        >
          <Camera className="w-6 h-6 text-accent-foreground" />
          <Sparkles className="w-3 h-3 text-accent-foreground absolute top-2 right-2" />
        </Button>
      </div>

      {/* Add Meal Sheet */}
      <AddMealSheet 
        isOpen={isAddMealOpen}
        onClose={() => setIsAddMealOpen(false)}
        onAddEntry={handleAddEntry}
      />
    </div>
  );
}
