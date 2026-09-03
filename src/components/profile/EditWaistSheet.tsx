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

interface EditWaistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue?: number;
  onSave: (value: number) => Promise<void>;
}

export function EditWaistSheet({
  open,
  onOpenChange,
  currentValue,
  onSave,
}: EditWaistSheetProps) {
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
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <SheetHeader className="text-left">
          <SheetTitle>Redigera midjemått</SheetTitle>
          <SheetDescription>
            Ange ditt aktuella midjemått i centimeter
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waist">Midjemått (cm)</Label>
            <Input
              id="waist"
              type="number"
              inputMode="decimal"
              placeholder="t.ex. 85"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={40}
              max={200}
              step={0.5}
              autoFocus={false}
              onFocus={(e) => {
                const el = e.currentTarget;
                setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
              }}
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
