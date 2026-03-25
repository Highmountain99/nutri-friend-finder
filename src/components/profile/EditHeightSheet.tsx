import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditHeightSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue?: number;
  onSave: (value: number) => Promise<void>;
}

export function EditHeightSheet({
  open,
  onOpenChange,
  currentValue,
  onSave,
}: EditHeightSheetProps) {
  const [value, setValue] = useState(currentValue?.toString() ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;
    
    setIsSaving(true);
    try {
      await onSave(numValue);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Redigera längd</SheetTitle>
          <SheetDescription>
            Ange din längd i centimeter
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="height">Längd (cm)</Label>
            <Input
              id="height"
              type="number"
              inputMode="numeric"
              placeholder="t.ex. 175"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={100}
              max={250}
              step={1}
              autoFocus={false}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={isSaving || !value || parseFloat(value) <= 0}
          >
            {isSaving ? "Sparar..." : "Spara"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
