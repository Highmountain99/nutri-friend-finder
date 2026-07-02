import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MetricType, METRIC_LABELS } from "@/types/progress";

interface LogMetricSheetProps {
  metricType: MetricType;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function LogMetricSheet({ metricType, onSuccess, trigger }: LogMetricSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const metricConfig = METRIC_LABELS[metricType];

  const handleSave = async () => {
    if (!user || !value) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('health_tracking_entries')
        .upsert({
          user_id: user.id,
          entry_date: new Date().toISOString().split('T')[0],
          metric_type: metricType,
          value: parseFloat(value),
          unit: metricConfig.unit,
          notes: notes || null,
        }, { onConflict: 'user_id,entry_date,metric_type' });

      if (error) throw error;

      toast.success(`${metricConfig.label} sparad`);
      setOpen(false);
      setValue("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["health-profile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["progress-data"] });
      queryClient.invalidateQueries({ queryKey: ["health-tracking"] });
      onSuccess?.();
    } catch (error) {
      console.error('Error saving metric:', error);
      toast.error('Kunde inte spara värdet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Logga {metricConfig.label.toLowerCase()}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Logga {metricConfig.label.toLowerCase()}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="value">{metricConfig.label} ({metricConfig.unit})</Label>
            <Input
              id="value"
              type="number"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Ange ${metricConfig.label.toLowerCase()}`}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notes">Anteckningar (valfritt)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lägg till anteckningar..."
              className="mt-1"
              rows={3}
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!value || saving}
            className="w-full"
          >
            {saving ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
