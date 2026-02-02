import { TriageResult, TriageReasonCode } from '@/types/intake';
import { getTriageExplanation, getPricingInfo } from '@/lib/triageEngine';
import { Check, Stethoscope, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TriageResultCardProps {
  result: TriageResult;
  reasonCode: TriageReasonCode;
  className?: string;
}

export function TriageResultCard({ result, reasonCode, className }: TriageResultCardProps) {
  const explanation = getTriageExplanation(reasonCode, result);
  const pricing = getPricingInfo(result);
  
  const isDietist = result === 'dietist';
  const Icon = isDietist ? Stethoscope : Heart;
  const title = isDietist ? 'Legitimerad dietist' : 'Kostrådgivare';
  const subtitle = isDietist 
    ? 'Medicinsk nutrition via primärvården'
    : 'Hälsa och välmående på dina villkor';

  return (
    <div className={cn(
      "rounded-2xl border-2 p-6 space-y-4",
      isDietist ? "border-primary bg-primary/5" : "border-accent bg-accent/5",
      className
    )}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
          isDietist ? "bg-primary/10" : "bg-accent/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            isDietist ? "text-primary" : "text-accent"
          )} />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {explanation}
      </p>

      {/* Pricing */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl",
        isDietist ? "bg-primary/10" : "bg-accent/10"
      )}>
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isDietist ? "bg-primary" : "bg-accent"
        )}>
          <Check className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className={cn(
            "font-semibold",
            isDietist ? "text-primary" : "text-accent"
          )}>
            {pricing.label}
          </p>
          <p className="text-xs text-muted-foreground">{pricing.description}</p>
        </div>
      </div>
    </div>
  );
}
