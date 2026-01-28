import React, { useState, useRef, useEffect } from "react";
import { Camera, Image, Loader2, Save, Trash2, HelpCircle, RefreshCw, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MealTypeDropdown } from "./MealTypeDropdown";
import { MealTimeSelector } from "./MealTimeSelector";
import type { NutritionEntry, Ingredient } from "@/hooks/useJournalData";

interface EditMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  entry: NutritionEntry | null;
  onSave: (updates: Partial<NutritionEntry> & { mealTime?: Date }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function EditMealSheet({ isOpen, onClose, entry, onSave, onDelete }: EditMealSheetProps) {
  // Local state for editing
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("");
  const [mealTime, setMealTime] = useState<Date>(new Date());
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [isAiEstimated, setIsAiEstimated] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  const [showIngredients, setShowIngredients] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState("");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize state when entry changes
  useEffect(() => {
    if (entry) {
      setMealName(entry.mealName);
      setMealType(entry.mealType);
      setMealTime(new Date(entry.createdAt));
      setImageUrl(entry.imageUrl);
      setCalories(entry.calories);
      setProtein(entry.protein);
      setCarbs(entry.carbs);
      setFat(entry.fat);
      setIsAiEstimated(entry.isAiEstimated);
      setIngredients(entry.ingredients || []);
    }
  }, [entry]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = "";
  };

  const handleQuickAdjust = (multiplier: number) => {
    setCalories(Math.round(calories * multiplier));
    setProtein(Math.round(protein * multiplier * 10) / 10);
    setCarbs(Math.round(carbs * multiplier * 10) / 10);
    setFat(Math.round(fat * multiplier * 10) / 10);
    setIngredients(ingredients.map(ing => ({
      ...ing,
      calories: Math.round(ing.calories * multiplier),
      protein: Math.round(ing.protein * multiplier * 10) / 10,
      carbs: Math.round(ing.carbs * multiplier * 10) / 10,
      fat: Math.round(ing.fat * multiplier * 10) / 10,
    })));
  };

  const handleRecalculate = async (adjustment: string) => {
    setIsRecalculating(true);
    
    try {
      const originalEstimation = {
        mealName,
        mealType,
        calories,
        protein,
        carbs,
        fat,
        ingredients,
        confidence: "high" as const,
      };

      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          analysisType: "adjust",
          originalEstimation,
          adjustment,
        },
      });

      if (error) throw error;
      
      setCalories(result.calories);
      setProtein(result.protein);
      setCarbs(result.carbs);
      setFat(result.fat);
      if (result.ingredients) {
        setIngredients(result.ingredients);
      }
      setAdjustmentText("");
      toast({
        title: "Uppskattning uppdaterad",
        description: "Näringsvärdena har räknats om.",
      });
    } catch (error) {
      console.error("Recalculation failed:", error);
      toast({
        title: "Omräkning misslyckades",
        description: "Kunde inte räkna om. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        mealName,
        mealType,
        mealTime,
        imageUrl,
        calories,
        protein,
        carbs,
        fat,
        isAiEstimated,
        ingredients,
      });
      toast({
        title: "Måltid uppdaterad",
        description: "Dina ändringar har sparats.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Kunde inte spara",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete();
      toast({
        title: "Måltid borttagen",
        description: "Måltiden har tagits bort från din logg.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Kunde inte ta bort",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    }
  };

  if (!entry) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center">Redigera måltid</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] pb-4">
            {/* Image with change buttons */}
            <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted">
              {imageUrl ? (
                <img src={imageUrl} alt={mealName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Image change buttons */}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1 bg-background/90 hover:bg-background"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-3 h-3" />
                  Ny
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1 bg-background/90 hover:bg-background"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <Image className="w-3 h-3" />
                  Galleri
                </Button>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* Meal type dropdown */}
            <div className="space-y-2">
              <Label>Måltidstyp</Label>
              <MealTypeDropdown value={mealType} onChange={setMealType} />
            </div>

            {/* Time selector */}
            <div className="space-y-2">
              <Label>Tidpunkt</Label>
              <MealTimeSelector value={mealTime} onChange={setMealTime} />
            </div>

            {/* Meal name */}
            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <Input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="T.ex. Lax med potatis och sallad"
              />
            </div>

            {/* Nutrition card */}
            <Card className="shadow-soft">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {isAiEstimated && (
                      <Badge variant="outline" className="mb-2 gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI-uppskattning
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Macros grid */}
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="bg-muted/50 p-3 rounded-lg text-center">
                    <span className="block text-muted-foreground text-xs mb-1">Kcal</span>
                    <p className="font-bold text-foreground text-lg">{calories}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg text-center">
                    <span className="block text-muted-foreground text-xs mb-1">Protein</span>
                    <p className="font-bold text-primary text-lg">{Math.round(protein)}g</p>
                  </div>
                  <div className="bg-amber-500/10 p-3 rounded-lg text-center">
                    <span className="block text-muted-foreground text-xs mb-1">Kolh.</span>
                    <p className="font-bold text-amber-600 text-lg">{Math.round(carbs)}g</p>
                  </div>
                  <div className="bg-green-500/10 p-3 rounded-lg text-center">
                    <span className="block text-muted-foreground text-xs mb-1">Fett</span>
                    <p className="font-bold text-green-600 text-lg">{Math.round(fat)}g</p>
                  </div>
                </div>

                {/* Ingredients button */}
                {ingredients.length > 0 && (
                  <div>
                    <button
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowIngredients(true)}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Visa ingredienser ({ingredients.length})
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick adjustments */}
            <Card className="shadow-soft">
              <CardContent className="p-4 space-y-3">
                <Label className="text-sm">Justera mängd</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleQuickAdjust(0.5)}
                  >
                    Hälften
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleQuickAdjust(0.75)}
                  >
                    3/4
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleQuickAdjust(1.5)}
                  >
                    1.5x
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Skriv justering..."
                    value={adjustmentText}
                    onChange={(e) => setAdjustmentText(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleRecalculate(adjustmentText)}
                    disabled={!adjustmentText.trim() || isRecalculating}
                  >
                    {isRecalculating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex gap-3 sticky bottom-0 bg-background pt-2 pb-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                    Ta bort
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ta bort måltid?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill ta bort denna måltid? Detta kan inte ångras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Ta bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button className="flex-1 gap-2" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Spara ändringar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Ingredients Dialog */}
      <Dialog open={showIngredients} onOpenChange={setShowIngredients}>
        <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ingredienser</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-foreground">{ing.name}</p>
                  <p className="text-xs text-muted-foreground">{ing.amount}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{ing.calories} kcal</p>
                  <p className="text-xs text-muted-foreground">
                    P: {ing.protein}g | K: {ing.carbs}g | F: {ing.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
