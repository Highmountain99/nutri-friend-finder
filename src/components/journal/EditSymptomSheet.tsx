import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Mic, MicOff, Loader2, Trash2 } from "lucide-react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { SymptomEntry, NutritionEntry } from "@/hooks/useJournalData";

interface EditSymptomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  symptom: SymptomEntry | null;
  meals: NutritionEntry[];
  onUpdate: (id: string, updates: Partial<SymptomEntry>) => void;
  onDelete: (id: string) => void;
}

export function EditSymptomSheet({
  isOpen,
  onClose,
  symptom,
  meals,
  onUpdate,
  onDelete,
}: EditSymptomSheetProps) {
  const { toast } = useToast();
  const [selectedMealId, setSelectedMealId] = useState<string>("none");
  const [symptomTime, setSymptomTime] = useState("");
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Reset form when symptom changes
  useEffect(() => {
    if (symptom && isOpen) {
      setSelectedMealId(symptom.mealId || "none");
      setSymptomTime(format(symptom.symptomTime, "HH:mm"));
      setDescription(symptom.description);
    }
  }, [symptom, isOpen]);

  // ElevenLabs Scribe for speech-to-text
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      if (data.text) {
        setDescription((prev) => {
          if (prev && !prev.endsWith(" ")) {
            return prev + " " + data.text;
          }
          return prev + data.text;
        });
      }
    },
    onCommittedTranscript: (data) => {
      if (data.text) {
        setDescription((prev) => {
          if (prev && !prev.endsWith(" ") && !prev.endsWith(".")) {
            return prev + " " + data.text;
          }
          return prev + data.text;
        });
      }
    },
  });

  const startRecording = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-scribe-token"
      );

      if (error || !data?.token) {
        throw new Error(error?.message || "No token received");
      }

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Kunde inte starta inspelning",
        description: "Kontrollera att mikrofonen är aktiverad",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [scribe, toast]);

  const stopRecording = useCallback(async () => {
    try {
      await scribe.disconnect();
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
    setIsRecording(false);
  }, [scribe]);

  const handleSubmit = () => {
    if (!symptom) return;

    if (!description.trim()) {
      toast({
        title: "Beskrivning saknas",
        description: "Ange en beskrivning av ditt symptom",
        variant: "destructive",
      });
      return;
    }

    // Parse time
    const [hours, minutes] = symptomTime.split(":").map(Number);
    const symptomDate = new Date(symptom.symptomTime);
    symptomDate.setHours(hours, minutes, 0, 0);

    onUpdate(symptom.id, {
      mealId: selectedMealId === "none" ? null : selectedMealId,
      description: description.trim(),
      symptomTime: symptomDate,
    });

    handleClose();
  };

  const handleDelete = () => {
    if (!symptom) return;
    onDelete(symptom.id);
    handleClose();
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    onClose();
  };

  if (!symptom) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Redigera symptom</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Meal Selection */}
          <div className="space-y-2">
            <Label>Koppla till måltid</Label>
            <Select value={selectedMealId} onValueChange={setSelectedMealId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Välj måltid..." />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="none">Ej kopplat till måltid</SelectItem>
                {meals.map((meal) => (
                  <SelectItem key={meal.id} value={meal.id}>
                    {meal.mealType} - {meal.mealName} (
                    {format(meal.createdAt, "HH:mm", { locale: sv })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Tid för symptom</Label>
            <Input
              type="time"
              value={symptomTime}
              onChange={(e) => setSymptomTime(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Beskriv ditt symptom</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="T.ex. fick ont i magen 30 minuter efter lunch..."
              rows={4}
            />
            
            {/* Voice Input Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="lg"
                className="gap-2"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ansluter...
                  </>
                ) : isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Stoppa inspelning
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Tala in
                  </>
                )}
              </Button>
            </div>
            
            {isRecording && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                Lyssnar... Tala tydligt
              </p>
            )}
          </div>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2">
                <Trash2 className="w-4 h-4" />
                Ta bort symptom
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ta bort symptom?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta kan inte ångras. Symptomet kommer att raderas permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Ta bort
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Avbryt
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!description.trim()}
            >
              Spara
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
