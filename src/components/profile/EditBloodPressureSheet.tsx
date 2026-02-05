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

interface BloodPressure {
  systolic: number;
  diastolic: number;
}

interface EditBloodPressureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue?: BloodPressure;
  onSave: (value: BloodPressure) => Promise<void>;
}

export function EditBloodPressureSheet({
  open,
  onOpenChange,
  currentValue,
  onSave,
}: EditBloodPressureSheetProps) {
  const [systolic, setSystolic] = useState(currentValue?.systolic?.toString() ?? "");
  const [diastolic, setDiastolic] = useState(currentValue?.diastolic?.toString() ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    
    if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return;
    
    setIsSaving(true);
    try {
      await onSave({ systolic: sys, diastolic: dia });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = systolic && diastolic && 
    parseInt(systolic) > 0 && parseInt(diastolic) > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Redigera blodtryck</SheetTitle>
          <SheetDescription>
            Ange ditt blodtryck (systoliskt/diastoliskt)
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systolic">Övertryck (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
                inputMode="numeric"
                placeholder="t.ex. 120"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                min={60}
                max={250}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic">Undertryck (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                inputMode="numeric"
                placeholder="t.ex. 80"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                min={40}
                max={150}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Normalt blodtryck är under 140/90 mmHg
          </p>
          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={isSaving || !isValid}
          >
            {isSaving ? "Sparar..." : "Spara"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
