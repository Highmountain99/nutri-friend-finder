import { useState, useRef } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { StepLayout } from './StepLayout';
import { supabase } from '@/integrations/supabase/client';
import { categoryLabels, supportAreaOptions, PrimaryConcernCategory } from '@/types/intake';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIInputStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (data: {
    aiFreeText: string;
    aiParsedFields: {
      primaryConcernCategory?: string;
      primaryConcernSubcategory?: string;
      supportAreas?: string[];
      confidence?: number;
    };
  }) => void;
  onSkip: () => void;
  initialValue?: string;
}

export function AIInputStep({
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  initialValue = '',
}: AIInputStepProps) {
  const [text, setText] = useState(initialValue);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<{
    primaryConcernCategory?: string;
    primaryConcernSubcategory?: string;
    supportAreas?: string[];
    confidence?: number;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Kunde inte starta inspelning. Kontrollera mikrofonbehörighet.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // For now, we'll show a message that voice input was detected
    // In a real implementation, we'd use a speech-to-text service
    toast.info('Röstinspelning klar. Skriv din text i fältet nedan.');
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      toast.error('Skriv eller berätta vad du vill ha hjälp med');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-intake`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: text.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze');
      }

      const result = await response.json();
      setParsedResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Kunde inte analysera din text. Du kan fortsätta manuellt.');
      // Allow continuing without AI analysis
      setParsedResult({
        confidence: 0,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndContinue = () => {
    onNext({
      aiFreeText: text,
      aiParsedFields: parsedResult || {},
    });
  };

  const getCategoryLabel = (category: string): string => {
    return categoryLabels[category as PrimaryConcernCategory] || category;
  };

  const getSupportAreaLabel = (area: string): string => {
    const option = supportAreaOptions.find(o => o.value === area);
    return option?.label || area;
  };

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Beskriv med egna ord vad du vill ha hjälp med"
      subtitle="Du kan prata in eller skriva. Vi använder AI för att hjälpa dig hitta rätt dietist."
      onNext={parsedResult ? handleConfirmAndContinue : analyzeText}
      nextLabel={parsedResult ? 'Fortsätt' : 'Analysera'}
      nextDisabled={!text.trim() && !parsedResult}
      isLoading={isAnalyzing}
      showBackButton={false}
    >
      <div className="space-y-6">
        {/* Voice/Text input */}
        {!parsedResult && (
          <>
            <div className="relative">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="T.ex. 'Jag har problem med magen och tror det kan vara IBS. Vill ha hjälp med kost och FODMAP.'"
                className="min-h-[120px] pr-12 resize-none"
                disabled={isAnalyzing}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  "absolute bottom-2 right-2 transition-colors",
                  isRecording && "text-destructive bg-destructive/10"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Spelar in... Tryck på mikrofonen igen för att stoppa.
              </div>
            )}

            <button
              onClick={onSkip}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Hoppa över och välj manuellt
            </button>
          </>
        )}

        {/* Analysis result */}
        {parsedResult && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm font-medium">Vi har tolkat detta som:</span>
            </div>

            {parsedResult.primaryConcernCategory && (
              <div>
                <span className="text-sm text-muted-foreground">Huvudområde:</span>
                <p className="font-medium">
                  {getCategoryLabel(parsedResult.primaryConcernCategory)}
                </p>
              </div>
            )}

            {parsedResult.primaryConcernSubcategory && (
              <div>
                <span className="text-sm text-muted-foreground">Underkategori:</span>
                <p className="font-medium">{parsedResult.primaryConcernSubcategory}</p>
              </div>
            )}

            {parsedResult.supportAreas && parsedResult.supportAreas.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Stödbehov:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parsedResult.supportAreas.map((area) => (
                    <span
                      key={area}
                      className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {getSupportAreaLabel(area)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedResult.confidence !== undefined && parsedResult.confidence < 0.7 && (
              <p className="text-sm text-muted-foreground italic">
                Vi är inte helt säkra på tolkningen. Du kan justera valen i nästa steg.
              </p>
            )}

            <button
              onClick={() => {
                setParsedResult(null);
              }}
              className="text-sm text-primary underline hover:text-primary/80"
            >
              Redigera min beskrivning
            </button>
          </Card>
        )}
      </div>
    </StepLayout>
  );
}
