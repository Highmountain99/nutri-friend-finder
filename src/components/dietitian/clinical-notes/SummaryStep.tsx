import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { AISuggestion } from "./types";

interface SummaryStepProps {
  journal: { anamnesis: string; assessment: string; action: string; next_steps: string };
  onJournalChange: (field: string, value: string) => void;
  aiSuggestion: AISuggestion | null;
  aiLoading: boolean;
  onRequestAI: () => void;
}

export function SummaryStep({ journal, onJournalChange, aiSuggestion, aiLoading, onRequestAI }: SummaryStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Sammanfattning & journal</h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Mål och nuläge</label>
          <Textarea value={journal.anamnesis} onChange={e => onJournalChange("anamnesis", e.target.value)} rows={3} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">PT:ns observation</label>
          <Textarea value={journal.assessment} onChange={e => onJournalChange("assessment", e.target.value)} rows={3} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Planerade insatser</label>
          <Textarea value={journal.action} onChange={e => onJournalChange("action", e.target.value)} rows={3} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Överenskommelse till nästa gång</label>
          <Textarea value={journal.next_steps} onChange={e => onJournalChange("next_steps", e.target.value)} rows={2} />
        </div>
      </div>

      {/* AI suggestions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-beslutsstöd
            </CardTitle>
            <Button size="sm" variant="outline" onClick={onRequestAI} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
              Generera förslag
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiSuggestion ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Sammanfattning</p>
                <p>{aiSuggestion.summary}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Fokusområden</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiSuggestion.focusAreas.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">{a}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Föreslagna åtgärder</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {aiSuggestion.actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Uppföljning</p>
                <p>{aiSuggestion.followUp}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Klicka "Generera förslag" för att få AI-stödda rekommendationer baserade på den insamlade informationen.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
