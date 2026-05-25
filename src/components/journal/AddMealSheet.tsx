import React, { useState, useRef } from "react";
import { Camera, Image, Type, Loader2, Check, HelpCircle, RefreshCw, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OrganicLoader } from "@/components/ui/OrganicLoader";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Ingredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dataSource?: "livsmedelsverket" | "ai_estimation";
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

interface AddMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: {
    mealName: string;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isAiEstimated: boolean;
    imageUrl?: string;
    ingredients?: Ingredient[];
  }) => void;
  initialImage?: string | null;
}

type InputMode = "select" | "camera" | "gallery" | "text";
type ViewState = "input" | "analyzing" | "result";

export function AddMealSheet({ isOpen, onClose, onAddEntry, initialImage }: AddMealSheetProps) {
  const [inputMode, setInputMode] = useState<InputMode>("select");
  const [viewState, setViewState] = useState<ViewState>("input");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState("");
  const [estimation, setEstimation] = useState<FoodEstimation | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState("");
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handle initial image from camera FAB
  React.useEffect(() => {
    if (isOpen && initialImage) {
      setImagePreview(initialImage);
      setInputMode("camera");
      analyzeFood("image", initialImage);
    }
  }, [isOpen, initialImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fromCamera: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setInputMode(fromCamera ? "camera" : "gallery");
      analyzeFood("image", base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFood = async (type: "image" | "text", data: string) => {
    setViewState("analyzing");
    
    try {
      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          analysisType: type,
          imageBase64: type === "image" ? data : undefined,
          textDescription: type === "text" ? data : undefined,
        },
      });

      if (error) throw error;
      
      setEstimation(result as FoodEstimation);
      setViewState("result");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analys misslyckades",
        description: "Kunde inte analysera måltiden. Försök igen.",
        variant: "destructive",
      });
      setViewState("input");
    }
  };

  const handleTextSubmit = () => {
    if (!textDescription.trim()) return;
    analyzeFood("text", textDescription);
  };

  const handleRecalculate = async (adjustment: string) => {
    if (!estimation) return;
    
    setIsRecalculating(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          analysisType: "adjust",
          originalEstimation: estimation,
          adjustment,
        },
      });

      if (error) throw error;
      
      setEstimation(result as FoodEstimation);
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
    if (!estimation) return;
    
    setEstimation({
      ...estimation,
      calories: Math.round(estimation.calories * multiplier),
      protein: Math.round(estimation.protein * multiplier * 10) / 10,
      carbs: Math.round(estimation.carbs * multiplier * 10) / 10,
      fat: Math.round(estimation.fat * multiplier * 10) / 10,
      ingredients: estimation.ingredients.map(ing => ({
        ...ing,
        calories: Math.round(ing.calories * multiplier),
        protein: Math.round(ing.protein * multiplier * 10) / 10,
        carbs: Math.round(ing.carbs * multiplier * 10) / 10,
        fat: Math.round(ing.fat * multiplier * 10) / 10,
      })),
    });
  };

  const handleConfirm = () => {
    if (!estimation) return;
    
    onAddEntry({
      mealName: estimation.mealName,
      mealType: estimation.mealType,
      calories: estimation.calories,
      protein: estimation.protein,
      carbs: estimation.carbs,
      fat: estimation.fat,
      isAiEstimated: true,
      imageUrl: imagePreview || undefined,
      ingredients: estimation.ingredients,
    });
    
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setInputMode("select");
    setViewState("input");
    setImagePreview(null);
    setTextDescription("");
    setEstimation(null);
    setShowIngredients(false);
    setAdjustmentText("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const getDataSourceLabel = () => {
    if (!estimation?.dataSource) return null;
    
    switch (estimation.dataSource) {
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center">Lägg till måltid</SheetTitle>
          </SheetHeader>

          {/* Selection Mode */}
          {viewState === "input" && inputMode === "select" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Ta foto</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <Image className="w-6 h-6" />
                  <span className="text-xs">Välj bild</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => setInputMode("text")}
                >
                  <Type className="w-6 h-6" />
                  <span className="text-xs">Skriv in</span>
                </Button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, true)}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, false)}
              />
            </div>
          )}

          {/* Text Input Mode */}
          {viewState === "input" && inputMode === "text" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setInputMode("select")}
              >
                ← Tillbaka
              </Button>
              
              <div className="space-y-2">
                <Label>Beskriv din måltid</Label>
                <Textarea
                  placeholder="T.ex. 'En tallrik pasta carbonara med sallad och ett glas vin'"
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <Button 
                className="w-full"
                onClick={handleTextSubmit}
                disabled={!textDescription.trim()}
              >
                Analysera måltid
              </Button>
            </div>
          )}

          {/* Analyzing State */}
          {viewState === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {imagePreview && (
                <div className="w-32 h-32 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Mat" className="w-full h-full object-cover" />
                </div>
              )}
              <OrganicLoader size={64} label="Analyserar måltiden" />
              <p className="text-muted-foreground">Analyserar måltiden...</p>
              
            </div>
          )}

          {/* Result State */}
          {viewState === "result" && estimation && (
            <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Image preview with meal type badge */}
              {imagePreview && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Mat" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-background/90 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium">{estimation.mealType}</span>
                  </div>
                </div>
              )}

              {/* Meal info card */}
              <Card className="shadow-soft">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {dataSourceInfo && (
                        <Badge variant={dataSourceInfo.variant} className="mb-2 gap-1">
                          <dataSourceInfo.icon className="w-3 h-3" />
                          {dataSourceInfo.label}
                        </Badge>
                      )}
                      <p className="font-semibold text-foreground">{estimation.mealName}</p>
                      {!imagePreview && (
                        <p className="text-sm text-muted-foreground">{estimation.mealType}</p>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded flex-shrink-0",
                      estimation.confidence === "high" && "bg-green-100 text-green-700",
                      estimation.confidence === "medium" && "bg-amber-100 text-amber-700",
                      estimation.confidence === "low" && "bg-red-100 text-red-700"
                    )}>
                      {estimation.confidence === "high" ? "Hög" : estimation.confidence === "medium" ? "Medel" : "Låg"} säkerhet
                    </span>
                  </div>
                  
                  {/* Macros grid with color coding */}
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <span className="block text-muted-foreground text-xs mb-1">Kcal</span>
                      <p className="font-bold text-foreground text-lg">{estimation.calories}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg text-center">
                      <span className="block text-muted-foreground text-xs mb-1">Protein</span>
                      <p className="font-bold text-primary text-lg">{estimation.protein}g</p>
                    </div>
                    <div className="bg-amber-500/10 p-3 rounded-lg text-center">
                      <span className="block text-muted-foreground text-xs mb-1">Kolh.</span>
                      <p className="font-bold text-amber-600 text-lg">{estimation.carbs}g</p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-lg text-center">
                      <span className="block text-muted-foreground text-xs mb-1">Fett</span>
                      <p className="font-bold text-green-600 text-lg">{estimation.fat}g</p>
                    </div>
                  </div>

                  {/* Ingredients section */}
                  {estimation.ingredients && estimation.ingredients.length > 0 && (
                    <div>
                      <button
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowIngredients(true)}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Visa ingredienser ({estimation.ingredients.length})
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
              <div className="flex gap-3 sticky bottom-0 bg-background pt-2">
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  Börja om
                </Button>
                <Button className="flex-1 gap-2" onClick={handleConfirm}>
                  <Check className="w-4 h-4" />
                  Lägg till
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Ingredients Dialog */}
      <Dialog open={showIngredients} onOpenChange={setShowIngredients}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ingredienser</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {estimation?.ingredients.map((ing, index) => (
              <div key={index} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{ing.name}</p>
                    {ing.dataSource === "livsmedelsverket" && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        <Database className="w-2 h-2 mr-0.5" />
                        LV
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{ing.amount}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-medium">{ing.calories} kcal</p>
                  <div className="flex gap-2 text-muted-foreground">
                    <span className="text-primary">P: {ing.protein}g</span>
                    <span className="text-amber-600">K: {ing.carbs}g</span>
                    <span className="text-green-600">F: {ing.fat}g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
