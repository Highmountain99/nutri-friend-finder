import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, FileText, Save, Loader2 } from "lucide-react";
import { AreaSelector } from "./AreaSelector";
import { StepRenderer } from "./StepRenderer";
import { SummaryStep } from "./SummaryStep";
import { areaConfigs, getAreaConfig } from "./areaConfigs";
import { useClinicalNoteAI } from "@/hooks/dietitian/useClinicalNoteAI";
import type { AISuggestion } from "./types";
import { toast } from "sonner";

interface ClinicalNoteWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onSave: (entry: {
    anamnesis: string;
    assessment: string;
    action: string;
    next_steps: string;
    form_data?: Record<string, any>;
    area_type?: string;
  }) => void;
  isSaving?: boolean;
}

export function ClinicalNoteWizard({ open, onOpenChange, patientId, onSave, isSaving }: ClinicalNoteWizardProps) {
  const [areaId, setAreaId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [journal, setJournal] = useState({ anamnesis: "", assessment: "", action: "", next_steps: "" });
  const [aiSuggestion, setAISuggestion] = useState<AISuggestion | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { requestAI, isLoading: aiLoading } = useClinicalNoteAI();

  const config = areaId ? getAreaConfig(areaId) : null;
  const totalSteps = config ? config.steps.length : 0;
  const progress = totalSteps > 0 ? Math.round(((currentStep + 1) / (totalSteps + 1)) * 100) : 0;

  const handleFieldChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  const handleSelectArea = (id: string) => {
    setAreaId(id);
    setCurrentStep(0);
    setFormData({});
    setJournal({ anamnesis: "", assessment: "", action: "", next_steps: "" });
    setAISuggestion(null);
    setShowSummary(false);
    setErrors({});
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    } else {
      setAreaId(null);
    }
  };

  const handleNext = () => {
    const step = config?.steps[currentStep];
    if (step) {
      const missing: Record<string, string> = {};
      step.fields.forEach(f => {
        if (!f.required) return;
        if (f.showIf && !f.showIf(formData)) return;
        const v = formData[f.key];
        const empty = Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim();
        if (empty) missing[f.key] = "Det här fältet behöver fyllas i innan du går vidare.";
      });
      if (Object.keys(missing).length > 0) {
        setErrors(missing);
        return;
      }
    }
    setErrors({});
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
    } else {
      // Generate journal text and show summary
      if (config) {
        const generated = config.generateJournalText(formData);
        setJournal(generated);
      }
      setShowSummary(true);
    }
  };

  const handleGenerateJournal = () => {
    if (config) {
      const generated = config.generateJournalText(formData);
      setJournal(generated);
      toast.success("Journaltext genererad");
    }
  };

  const handleRequestAI = async () => {
    if (!config) return;
    const result = await requestAI({ areaId: config.id, areaTitle: config.title, formData });
    if (result) setAISuggestion(result);
  };

  const handleSave = () => {
    onSave({
      ...journal,
      form_data: formData,
      area_type: areaId || undefined,
    });
    // Reset after save
    setAreaId(null);
    setCurrentStep(0);
    setFormData({});
    setJournal({ anamnesis: "", assessment: "", action: "", next_steps: "" });
    setAISuggestion(null);
    setShowSummary(false);
  };

  const handleJournalChange = (field: string, value: string) => {
    setJournal(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {config ? (
                <>
                  <config.icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <span>{config.title}</span>
                </>
              ) : (
                "Nytt besök"
              )}
            </SheetTitle>
            {showSummary && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerateJournal}>
                  <FileText className="h-3 w-3 mr-1" /> Generera journal
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                  Spara
                </Button>
              </div>
            )}
          </div>
          {config && (
            <Progress value={showSummary ? 100 : progress} className="h-1.5" />
          )}
        </SheetHeader>

        <div className="mt-6 pb-8">
          {!areaId ? (
            <AreaSelector areas={areaConfigs} onSelect={handleSelectArea} />
          ) : showSummary ? (
            <>
              <SummaryStep
                journal={journal}
                onJournalChange={handleJournalChange}
                aiSuggestion={aiSuggestion}
                aiLoading={aiLoading}
                onRequestAI={handleRequestAI}
              />
              <div className="flex justify-start mt-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-3 w-3 mr-1" /> Tillbaka
                </Button>
              </div>
            </>
          ) : config ? (
            <>
              <StepRenderer
                step={config.steps[currentStep]}
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
              />
              <div className="flex justify-between mt-6">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-3 w-3 mr-1" /> {currentStep === 0 ? "Byt målområde" : "Tillbaka"}
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {currentStep < totalSteps - 1 ? (
                    <>Nästa <ArrowRight className="h-3 w-3 ml-1" /></>
                  ) : (
                    <>Sammanfattning <ArrowRight className="h-3 w-3 ml-1" /></>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Steg {currentStep + 1} av {totalSteps} — Alla fält är valfria
              </p>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
