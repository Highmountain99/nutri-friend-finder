import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { activityLevelLabels } from "@/hooks/useHealthProfile";
import type { Database } from "@/integrations/supabase/types";

type ActivityLevel = Database["public"]["Enums"]["activity_level"];

const activityLevelDescriptions: Record<ActivityLevel, string> = {
  sedentary: "Skrivbordsjobb, lite eller ingen träning",
  lightly_active: "Lätt träning 1-3 dagar/vecka",
  moderately_active: "Måttlig träning 3-5 dagar/vecka",
  active: "Hård träning 6-7 dagar/vecka",
  very_active: "Hård daglig träning eller fysiskt arbete",
};

interface EditActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue?: ActivityLevel;
  onSave: (value: ActivityLevel) => Promise<void>;
}

export function EditActivitySheet({
  open,
  onOpenChange,
  currentValue,
  onSave,
}: EditActivitySheetProps) {
  const [value, setValue] = useState<ActivityLevel | undefined>(currentValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!value) return;
    
    setIsSaving(true);
    try {
      await onSave(value);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Redigera aktivitetsnivå</SheetTitle>
          <SheetDescription>
            Välj den nivå som bäst beskriver din vardag
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <RadioGroup
            value={value}
            onValueChange={(v) => setValue(v as ActivityLevel)}
            className="space-y-3"
          >
            {(Object.keys(activityLevelLabels) as ActivityLevel[]).map((level) => (
              <div
                key={level}
                className="flex items-start space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setValue(level)}
              >
                <RadioGroupItem value={level} id={level} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={level} className="font-medium cursor-pointer">
                    {activityLevelLabels[level]}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activityLevelDescriptions[level]}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={isSaving || !value}
          >
            {isSaving ? "Sparar..." : "Spara"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
