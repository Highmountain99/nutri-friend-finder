import React, { useState, useRef, useEffect } from "react";
import { Camera, Image, Loader2, Check, HelpCircle, RefreshCw, Database, Sparkles, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MealTypeSelector } from "./MealTypeSelector";
import { MealTimeSelector } from "./MealTimeSelector";
import type { NutritionEntry, Ingredient } from "@/hooks/useJournalData";

interface EditMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  entry: NutritionEntry | null;
  onUpdate: (id: string, updates: Partial<NutritionEntry> & { mealTime?: Date }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface FoodEstimation {
  mealName: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  confidence: "high" | "medium" | "low";
  dataSource?: "livsmedelsverket" | "ai_estimation" | "mixed";
}

export function EditMealSheet({ isOpen, onClose, entry, onUpdate, onDelete }: EditMealSheetProps) {
  // Form state
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("");
  const [mealTime, setMealTime] = useState<Date>(new Date());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("medium");
  const [dataSource, setDataSource] = useState<"livsmedelsverket" | "ai_estimation" | "mixed">("ai_estimation");
  
  // UI state
  const [showIngredients, setShowIngredients] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState("");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize state when entry changes
  useEffect(() => {
    if (entry && isOpen) {
      setMealName(entry.mealName);
      setMealType(entry.mealType);
      setMealTime(new Date(entry.createdAt));
      setImagePreview(entry.imageUrl || null);
      setCalories(entry.calories);
      setProtein(entry.protein);
      setCarbs(entry.carbs);
      setFat(entry.fat);
      setIngredients(entry.ingredients || []);
      setConfidence("medium"); // Default since we don't store this
      setDataSource(entry.isAiEstimated ? "ai_estimation" : "livsmedelsverket");
    }
  }, [entry, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      
      // Re-analyze with new image
      await analyzeNewImage(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = "";
  };

  const analyzeNewImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          analysisType: "image",
          imageBase64,
        },
      });

      if (error) throw error;
      
      const estimation = result as FoodEstimation;
      setMealName(estimation.mealName);
      setMealType(estimation.mealType);
      setCalories(estimation.calories);
      setProtein(estimation.protein);
      setCarbs(estimation.carbs);
      setFat(estimation.fat);
      setIngredients(estimation.ingredients || []);
      setConfidence(estimation.confidence);
      setDataSource(estimation.dataSource || "ai_estimation");
      
      toast({
        title: "Ny bild analyserad",
        description: "Näringsvärdena har uppdaterats.",
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analys misslyckades",
        description: "Kunde inte analysera bilden. Näringsvärdena behålls.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecalculate = async (adjustment: string) => {
    if (!adjustment.trim()) return;
    
    setIsRecalculating(true);
    
    try {
      const originalEstimation: FoodEstimation = {
        mealName,
        mealType,
        calories,
        protein,
        carbs,
        fat,
        ingredients,
        confidence,
        dataSource,
      };
      
      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          analysisType: "adjust",
          originalEstimation,
          adjustment,
        },
      });

      if (error) throw error;
      
      const estimation = result as FoodEstimation;
      setCalories(estimation.calories);
      setProtein(estimation.protein);
      setCarbs(estimation.carbs);
      setFat(estimation.fat);
      setIngredients(estimation.ingredients || []);
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

  const handleSave = async () => {
    if (!entry) return;
    
    setIsSaving(true);
    
    try {
      await onUpdate(entry.id, {
        mealName,
        mealType,
        calories,
        protein,
        carbs,
        fat,
        imageUrl: imagePreview || undefined,
        ingredients,
        mealTime,
      });
      
      toast({
        title: "Måltid uppdaterad",
        description: "Dina ändringar har sparats.",
      });
      
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
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
    if (!entry) return;
    
    try {
      await onDelete(entry.id);
      toast({
        title: "Måltid borttagen",
        description: "Måltiden har tagits bort.",
      });
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Kunde inte ta bort",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const getDataSourceLabel = () => {
    switch (dataSource) {
      case "livsmedelsverket":
        return { label: "Livsmedelsverket", icon: Database, variant: "default" as const };
      case "mixed":
        return { label: "Livsmedelsverket + AI", icon: Database, variant: "secondary" as const };
      case "ai_estimation":
      default:
        return { label: "AI-uppskattning", icon: Sparkles, variant: "outline" as const };
    }
  };

  const dataSourceInfo = getDataSourceLabel();

  if (!entry) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center">Redigera måltid</SheetTitle>
          </SheetHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {imagePreview && (
                <div className="w-32 h-32 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Mat" className="w-full h-full object-cover" />
                </div>
              )}
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyserar ny bild...</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Image with replace buttons */}
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted">
                {imagePreview ? (
                  <img src={imagePreview} alt="Mat" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Image action buttons */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 bg-background/90 hover:bg-background"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-3 h-3" />
                    <span className="text-xs">Ny bild</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 bg-background/90 hover:bg-background"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <Image className="w-3 h-3" />
                    <span className="text-xs">Galleri</span>
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
                onChange={handleFileChange}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Meal metadata */}
              <Card className="shadow-soft">
                <CardContent className="p-4 space-y-4">
                  {/* Meal name */}
                  <div className="space-y-2">
                    <Label htmlFor="meal-name">Titel</Label>
                    <Input
                      id="meal-name"
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      placeholder="T.ex. Pasta med köttfärssås"
                    />
                  </div>
                  
                  {/* Meal type */}
                  <div className="space-y-2">
                    <Label>Måltidstyp</Label>
                    <MealTypeSelector value={mealType} onChange={setMealType} />
                  </div>
                  
                  {/* Meal time */}
                  <div className="space-y-2">
                    <Label>Tid</Label>
                    <MealTimeSelector value={mealTime} onChange={setMealTime} />
                  </div>
                </CardContent>
              </Card>

              {/* Nutrition info card - editable */}
              <Card className="shadow-soft">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {dataSourceInfo && (
                        <Badge variant={dataSourceInfo.variant} className="gap-1">
                          <dataSourceInfo.icon className="w-3 h-3" />
                          {dataSourceInfo.label}
                        </Badge>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded flex-shrink-0",
                      confidence === "high" && "bg-green-100 text-green-700",
                      confidence === "medium" && "bg-amber-100 text-amber-700",
                      confidence === "low" && "bg-red-100 text-red-700"
                    )}>
                      {confidence === "high" ? "Hög" : confidence === "medium" ? "Medel" : "Låg"} säkerhet
                    </span>
                  </div>
                  
                  {/* Editable Macros grid */}
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="bg-muted/50 p-2 rounded-lg text-center">
                      <Label className="block text-muted-foreground text-xs mb-1">Kcal</Label>
                      <Input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-center font-bold text-foreground text-lg p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg text-center">
                      <Label className="block text-muted-foreground text-xs mb-1">Protein</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={protein}
                          onChange={(e) => setProtein(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="h-8 text-center font-bold text-primary text-lg p-1 pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-lg text-center">
                      <Label className="block text-muted-foreground text-xs mb-1">Kolh.</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={carbs}
                          onChange={(e) => setCarbs(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="h-8 text-center font-bold text-amber-600 text-lg p-1 pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
                      </div>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-lg text-center">
                      <Label className="block text-muted-foreground text-xs mb-1">Fett</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={fat}
                          onChange={(e) => setFat(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="h-8 text-center font-bold text-green-600 text-lg p-1 pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Ingredients section - inline view */}
              {ingredients.length > 0 && (
                <Card className="shadow-soft">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Ingredienser ({ingredients.length})</Label>
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowIngredients(true)}
                      >
                        Redigera detaljer
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ingredients.map((ing, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-medium truncate">{ing.name}</span>
                            {ing.dataSource === "livsmedelsverket" && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 flex-shrink-0">
                                <Database className="w-2 h-2 mr-0.5" />
                                LV
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground flex-shrink-0">{ing.amount}</span>
                          </div>
                          <span className="text-xs font-medium flex-shrink-0 ml-2">{ing.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ta bort måltid?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Är du säker på att du vill ta bort "{mealName}"? Detta går inte att ångra.
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
                
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Avbryt
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Spara
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Ingredients Dialog - editable */}
      <Dialog open={showIngredients} onOpenChange={setShowIngredients}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Redigera ingredienser</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ingredients.map((ing, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm flex-1">{ing.name}</p>
                  {ing.dataSource === "livsmedelsverket" && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      <Database className="w-2 h-2 mr-0.5" />
                      LV
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{ing.amount}</p>
                
                {/* Editable nutrition values for ingredient */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Kcal</Label>
                    <Input
                      type="number"
                      value={ing.calories}
                      onChange={(e) => {
                        const newIngredients = [...ingredients];
                        newIngredients[index] = {
                          ...ing,
                          calories: Math.max(0, parseInt(e.target.value) || 0)
                        };
                        setIngredients(newIngredients);
                      }}
                      className="h-7 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-primary">Protein</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ing.protein}
                      onChange={(e) => {
                        const newIngredients = [...ingredients];
                        newIngredients[index] = {
                          ...ing,
                          protein: Math.max(0, parseFloat(e.target.value) || 0)
                        };
                        setIngredients(newIngredients);
                      }}
                      className="h-7 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-amber-600">Kolh.</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ing.carbs}
                      onChange={(e) => {
                        const newIngredients = [...ingredients];
                        newIngredients[index] = {
                          ...ing,
                          carbs: Math.max(0, parseFloat(e.target.value) || 0)
                        };
                        setIngredients(newIngredients);
                      }}
                      className="h-7 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-green-600">Fett</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ing.fat}
                      onChange={(e) => {
                        const newIngredients = [...ingredients];
                        newIngredients[index] = {
                          ...ing,
                          fat: Math.max(0, parseFloat(e.target.value) || 0)
                        };
                        setIngredients(newIngredients);
                      }}
                      className="h-7 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Recalculate totals button */}
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={() => {
              // Sum up all ingredient values
              const totals = ingredients.reduce(
                (acc, ing) => ({
                  calories: acc.calories + ing.calories,
                  protein: acc.protein + ing.protein,
                  carbs: acc.carbs + ing.carbs,
                  fat: acc.fat + ing.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              );
              setCalories(Math.round(totals.calories));
              setProtein(Math.round(totals.protein * 10) / 10);
              setCarbs(Math.round(totals.carbs * 10) / 10);
              setFat(Math.round(totals.fat * 10) / 10);
              setShowIngredients(false);
              toast({
                title: "Näringsvärden uppdaterade",
                description: "Totalen har räknats om baserat på ingredienserna.",
              });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Räkna om total från ingredienser
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
