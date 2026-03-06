import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { RecipeDetail } from "@/hooks/useRecipeDetail";

interface CookingModeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: RecipeDetail;
}

export function CookingModeSheet({
  open,
  onOpenChange,
  recipe,
}: CookingModeSheetProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">("instructions");

  const totalSteps = recipe.instructions.length;

  const goToPrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const currentInstruction = recipe.instructions[currentStep];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{recipe.title}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "instructions" | "ingredients")}
          className="flex-1 flex flex-col mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instruktioner</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredienser</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="flex-1 flex flex-col mt-6">
            {/* Step indicator */}
            <div className="text-center mb-4">
              <span className="text-sm text-muted-foreground">
                STEG {currentStep + 1} AV {totalSteps}
              </span>
            </div>

            {/* Instruction content */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="bg-muted/50 rounded-xl p-8 max-w-md">
                <p className="text-xl text-center text-foreground leading-relaxed">
                  {currentInstruction?.text || "Inga instruktioner"}
                </p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 py-4">
              {recipe.instructions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === currentStep
                      ? "bg-primary"
                      : i < currentStep
                      ? "bg-primary/50"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-4 px-4 pb-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={goToPrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Föregående
              </Button>
              <Button
                className="flex-1"
                onClick={goToNext}
                disabled={currentStep === totalSteps - 1}
              >
                Nästa
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ingredients" className="flex-1 overflow-y-auto mt-6">
            <div className="px-4 pb-6">
              <p className="text-sm text-muted-foreground mb-4">
                {recipe.servings} portioner
              </p>
              <ul className="space-y-4">
                {recipe.ingredients.map((ingredient, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-lg text-foreground">
                      {(ingredient.amount ?? ingredient.quantity) && (
                        <span className="font-semibold">{ingredient.amount ?? ingredient.quantity} </span>
                      )}
                      {ingredient.unit && <span>{ingredient.unit} </span>}
                      {ingredient.ingredient || ingredient.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
