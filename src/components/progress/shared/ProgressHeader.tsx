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
    <div className="mb-6">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
      {phase && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-foreground">{phase.name}</span>
            <span className="text-muted-foreground">
              Fas {phase.current} av {phase.total}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}
    </div>
  );
}
