import { useState, useRef } from "react";
import { Flame, Drumstick, Wheat, Droplet, ChevronLeft, ChevronRight, Plus, Camera, AlertCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalCalendar } from "@/components/journal/JournalCalendar";
import { NutritionProgressCard } from "@/components/journal/NutritionProgressCard";
import { AITrackingOnboarding } from "@/components/journal/AITrackingOnboarding";
import { AITrackingSetupForm, AITrackingFormData } from "@/components/journal/AITrackingSetupForm";
import { HealthMetricsView } from "@/components/journal/HealthMetricsView";
import { MealTimeline } from "@/components/journal/MealTimeline";
import { AddMealSheet } from "@/components/journal/AddMealSheet";
import { EditMealSheet } from "@/components/journal/EditMealSheet";
import { AddSymptomSheet } from "@/components/journal/AddSymptomSheet";
import { EditSymptomSheet } from "@/components/journal/EditSymptomSheet";
import { EditNutritionGoalsSheet } from "@/components/journal/EditNutritionGoalsSheet";
import { useJournalData, type Ingredient, type NutritionEntry, type SymptomEntry } from "@/hooks/useJournalData";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { cn } from "@/lib/utils";
type JournalView = "main" | "ai-setup";
type SwipeView = "nutrition" | "health";

// Helper to get streak emoji based on streak count
function getStreakDisplay(streak: number): {
  emoji: string;
  text: string;
} | null {
  if (streak <= 0) return null;
  let emoji = "🔥";
  if (streak >= 30) {
    emoji = "🔥🔥🔥";
  } else if (streak >= 7) {
    emoji = "🔥🔥";
  }
  return {
    emoji,
    text: `${streak}-dagarsstreak!`
  };
}
export default function Journal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<JournalView>("main");
  const [swipeView, setSwipeView] = useState<SwipeView>("nutrition");
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isEditMealOpen, setIsEditMealOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);
  const [isAddSymptomOpen, setIsAddSymptomOpen] = useState(false);
  const [isEditSymptomOpen, setIsEditSymptomOpen] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<SymptomEntry | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isLoading,
    goals,
    dailyTotals,
    entries,
    symptoms,
    settings,
    healthMetrics,
    appleHealthSettings,
    streak,
    daysWithEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    addSymptom,
    updateSymptom,
    deleteSymptom,
    updateSettings,
    updateGoals,
    connectAppleHealth
  } = useJournalData(selectedDate);

  // Swipe gesture for nutrition/health view - must be called unconditionally
  // Show onboarding only if AI tracking is enabled but onboarding not completed
  const showOnboarding = settings.aiTrackingEnabled && !settings.aiTrackingOnboardingCompleted;
  const contentSwipeHandlers = useSwipeGesture({
    onSwipeLeft: () => !showOnboarding && setSwipeView("health"),
    onSwipeRight: () => setSwipeView("nutrition"),
    threshold: 50
  });

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      setIsAddMealOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Calculate remaining macros
  const remaining = {
    calories: goals.caloriesGoal - dailyTotals.calories,
    protein: goals.proteinGoal - dailyTotals.protein,
    carbs: goals.carbsGoal - dailyTotals.carbs,
    fat: goals.fatGoal - dailyTotals.fat
  };
  const allNutritionCards = [{
    icon: Flame,
    label: "Kalorier",
    remaining: remaining.calories,
    goal: goals.caloriesGoal,
    unit: "kcal",
    color: "text-foreground",
    bgColor: "bg-muted",
    visible: settings.showCalories
  }, {
    icon: Drumstick,
    label: "Protein",
    remaining: Math.round(remaining.protein),
    goal: goals.proteinGoal,
    unit: "g",
    color: "text-primary",
    bgColor: "bg-primary/10",
    visible: settings.showProtein
  }, {
    icon: Wheat,
    label: "Kolhydrater",
    remaining: Math.round(remaining.carbs),
    goal: goals.carbsGoal,
    unit: "g",
    color: "text-accent",
    bgColor: "bg-accent/10",
    visible: settings.showCarbs
  }, {
    icon: Droplet,
    label: "Fett",
    remaining: Math.round(remaining.fat),
    goal: goals.fatGoal,
    unit: "g",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    visible: settings.showFat
  }];
  
  // Filter to only show visible nutrition cards
  const nutritionCards = allNutritionCards.filter(card => card.visible);

  const handleAISetupComplete = (data: AITrackingFormData) => {
    updateSettings({
      aiTrackingEnabled: true,
      aiTrackingOnboardingCompleted: true,
      gender: data.gender,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      activityLevel: data.activityLevel
    });
    setView("main");
  };

  const handleSkipAITracking = () => {
    updateSettings({
      aiTrackingOnboardingCompleted: true
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
      ingredients: entry.ingredients
    });
    setIsAddMealOpen(false);
  };

  // Get streak display
  const streakDisplay = getStreakDisplay(streak);

  // Show AI setup form - MUST be after all hooks
  if (view === "ai-setup") {
    return (
      <div className="px-4 py-6 animate-fade-in">
        <AITrackingSetupForm onComplete={handleAISetupComplete} onBack={() => setView("main")} />
      </div>
    );
  }

  return <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in pb-32">
      {/* Journal Calendar */}
      <JournalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} daysWithEntries={daysWithEntries} />

      {/* Streak indicator - only show if streak > 0 */}
      {streakDisplay && <div className="bg-accent/10 py-2 px-4 rounded-full text-center animate-fade-in">
          <span className="text-sm text-accent font-medium">
            {streakDisplay.emoji} {streakDisplay.text}
          </span>
        </div>}

      {/* Swipeable Area Indicator */}
      <div className="flex justify-center gap-2">
        <button onClick={() => setSwipeView("nutrition")} className={cn("w-2 h-2 rounded-full transition-all", swipeView === "nutrition" ? "bg-primary w-4" : "bg-muted-foreground/30")} />
        <button onClick={() => setSwipeView("health")} className={cn("w-2 h-2 rounded-full transition-all", swipeView === "health" ? "bg-primary w-4" : "bg-muted-foreground/30")} />
      </div>

      {/* Swipeable Content Area */}
      <div className="relative overflow-hidden touch-pan-y" onTouchStart={contentSwipeHandlers.onTouchStart} onTouchMove={contentSwipeHandlers.onTouchMove} onTouchEnd={contentSwipeHandlers.onTouchEnd}>
        <div ref={swipeContainerRef} className={cn("flex transition-transform duration-300 ease-out", swipeView === "health" && "-translate-x-full")}>
          {/* Nutrition View */}
          <div className="w-full flex-shrink-0 space-y-4">
            {showOnboarding ? <AITrackingOnboarding onActivate={handleActivateAITracking} onSkip={handleSkipAITracking} /> : <>
                {/* Nutrition Cards - Dynamic grid based on visible cards */}
                {nutritionCards.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Dagliga mål</span>
                      <button onClick={() => setIsEditGoalsOpen(true)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                        <Settings2 className="w-3 h-3" /> Ändra mål
                      </button>
                    </div>
                    <div className={cn(
                      "grid gap-2 sm:gap-3",
                      nutritionCards.length === 1 && "grid-cols-1",
                      nutritionCards.length === 2 && "grid-cols-2",
                      nutritionCards.length === 3 && "grid-cols-3",
                      nutritionCards.length >= 4 && "grid-cols-2"
                    )}>
                      {nutritionCards.map(card => <NutritionProgressCard key={card.label} {...card} />)}
                    </div>
                  </>
                )}
              </>}
          </div>

          {/* Health Metrics View */}
          <div className="w-full flex-shrink-0 pl-4">
            <HealthMetricsView isConnected={appleHealthSettings.connected} steps={healthMetrics.steps} activeEnergy={healthMetrics.activeEnergy} onConnect={connectAppleHealth} />
          </div>
        </div>

        {/* Swipe Navigation Buttons */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          {swipeView === "health" && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 shadow-sm" onClick={() => setSwipeView("nutrition")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          {swipeView === "nutrition" && !showOnboarding && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 shadow-sm" onClick={() => setSwipeView("health")}>
              <ChevronRight className="w-4 h-4" />
            </Button>}
        </div>
      </div>

      {/* Add Meal & Symptom Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={() => setIsAddMealOpen(true)}>
          <Plus className="w-4 h-4" />
          Lägg till måltid
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 gap-2" 
          onClick={() => setIsAddSymptomOpen(true)}
          disabled={entries.length === 0}
        >
          <AlertCircle className="w-4 h-4" />
          Lägg till symptom
        </Button>
      </div>

      {/* Meal Timeline */}
      <div className="space-y-3">
        <MealTimeline 
          entries={entries}
          symptoms={symptoms}
          onEntryClick={entry => {
            setEditingEntry(entry);
            setIsEditMealOpen(true);
          }}
          onSymptomClick={symptom => {
            setEditingSymptom(symptom);
            setIsEditSymptomOpen(true);
          }}
          showCalories={settings.showCalories}
          showProtein={settings.showProtein}
          showCarbs={settings.showCarbs}
          showFat={settings.showFat}
        />
      </div>

      {/* Hidden camera input */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />

      {/* Fixed Camera FAB - Always visible */}
      <div className="fixed bottom-24 right-4 z-50">
        <Button size="icon" className="h-14 w-14 rounded-full shadow-elevated bg-primary hover:bg-primary/90 relative" onClick={() => cameraInputRef.current?.click()}>
          <Camera className="w-6 h-6 text-accent-foreground" />
        </Button>
      </div>

      {/* Add Meal Sheet */}
      <AddMealSheet 
        isOpen={isAddMealOpen} 
        onClose={() => {
          setIsAddMealOpen(false);
          setCapturedImage(null);
        }} 
        onAddEntry={handleAddEntry} 
        initialImage={capturedImage} 
      />

      {/* Edit Meal Sheet */}
      <EditMealSheet 
        isOpen={isEditMealOpen} 
        onClose={() => {
          setIsEditMealOpen(false);
          setEditingEntry(null);
        }} 
        entry={editingEntry} 
        onUpdate={updateEntry} 
        onDelete={deleteEntry} 
      />

      {/* Add Symptom Sheet */}
      <AddSymptomSheet
        isOpen={isAddSymptomOpen}
        onClose={() => setIsAddSymptomOpen(false)}
        onAddSymptom={addSymptom}
        meals={entries}
      />

      {/* Edit Symptom Sheet */}
      <EditSymptomSheet
        isOpen={isEditSymptomOpen}
        onClose={() => {
          setIsEditSymptomOpen(false);
          setEditingSymptom(null);
        }}
        symptom={editingSymptom}
        meals={entries}
        onUpdate={updateSymptom}
        onDelete={deleteSymptom}
      />

      {/* Edit Nutrition Goals Sheet */}
      <EditNutritionGoalsSheet
        open={isEditGoalsOpen}
        onOpenChange={setIsEditGoalsOpen}
        goals={goals}
        onSave={updateGoals}
      />
    </div>;
}