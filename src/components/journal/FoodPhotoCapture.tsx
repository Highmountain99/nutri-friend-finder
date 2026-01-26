import { useState, useRef } from "react";
import { Camera, X, Loader2, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FoodPhotoProps {
  onAddEntry: (entry: NutritionEntry) => void;
}

interface NutritionEntry {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isAiEstimated: boolean;
}

interface AIEstimation {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function FoodPhotoCapture({ onAddEntry }: FoodPhotoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [estimation, setEstimation] = useState<AIEstimation | null>(null);
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
    
    // Simulate AI analysis - in production this would call an edge function
    // that uses Lovable AI to analyze the food image
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI response
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
    
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setImagePreview(null);
    setEstimation(null);
    setIsAnalyzing(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className="w-full gap-2"
        variant="outline"
      >
        <Camera className="w-5 h-5" />
        Ta foto på mat
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                  onClick={() => {
                    setImagePreview(null);
                    setEstimation(null);
                  }}
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
    </>
  );
}
