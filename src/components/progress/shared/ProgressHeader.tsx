import { Progress } from "@/components/ui/progress";

interface ProgressHeaderProps {
  title: string;
  subtitle?: string;
  phase?: {
    name: string;
    current: number;
    total: number;
  };
}

export function ProgressHeader({ title, subtitle, phase }: ProgressHeaderProps) {
  const progressPercentage = phase ? (phase.current / phase.total) * 100 : 0;

  return (
    <div className="mb-2">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
      {phase && (
        <div className="mt-5 bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-semibold text-foreground">{phase.name}</span>
            <span className="text-muted-foreground font-medium">
              Fas {phase.current} av {phase.total}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2.5 rounded-full" />
        </div>
      )}
    </div>
  );
}
