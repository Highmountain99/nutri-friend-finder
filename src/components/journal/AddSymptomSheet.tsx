import { useState, useCallback } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Mic, MicOff, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { NutritionEntry } from "@/hooks/useJournalData";

interface AddSymptomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSymptom: (symptom: {
    mealId: string | null;
    description: string;
    symptomTime: Date;
  }) => void;
  meals: NutritionEntry[];
}

export function AddSymptomSheet({
  isOpen,
  onClose,
  onAddSymptom,
  meals,
}: AddSymptomSheetProps) {
  const { toast } = useToast();
  const [selectedMealId, setSelectedMealId] = useState<string>("none");
  const [symptomTime, setSymptomTime] = useState(() =>
    format(new Date(), "HH:mm")
  );
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ElevenLabs Scribe for speech-to-text
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      // Update description with partial transcription
      if (data.text) {
        setDescription((prev) => {
          // If we have existing text, append to it
          if (prev && !prev.endsWith(" ")) {
            return prev + " " + data.text;
          }
          return prev + data.text;
        });
      }
    },
    onCommittedTranscript: (data) => {
      // Final transcription
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
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-scribe-token"
      );

      if (error || !data?.token) {
        throw new Error(error?.message || "No token received");
      }

      // Start transcription
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
    const symptomDate = new Date();
    symptomDate.setHours(hours, minutes, 0, 0);

    onAddSymptom({
      mealId: selectedMealId === "none" ? null : selectedMealId,
      description: description.trim(),
      symptomTime: symptomDate,
    });

    // Reset form
    handleClose();
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setSelectedMealId("none");
    setSymptomTime(format(new Date(), "HH:mm"));
    setDescription("");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Lägg till symptom</SheetTitle>
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
              Lägg till
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
