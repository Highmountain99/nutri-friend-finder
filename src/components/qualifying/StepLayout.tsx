import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from './ProgressIndicator';

interface StepLayoutProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  showBackButton?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

export function StepLayout({
  currentStep,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Nästa',
  nextDisabled = false,
  isLoading = false,
  showBackButton = true,
  showSkip = false,
  onSkip,
  skipLabel = 'Hoppa över',
}: StepLayoutProps) {
  return (
    <div className="min-h-dvh bg-background flex flex-col safe-area-inset">
      {/* Header with progress */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-4">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Tillbaka"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          )}
          <div className="flex-1">
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mb-6">{subtitle}</p>
          )}
          {children}
        </div>
      </div>

      {/* Footer with CTA */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background pb-safe">
        <div className="max-w-lg mx-auto space-y-2">
          <Button
            onClick={onNext}
            size="xl"
            className="w-full h-14 text-base font-medium"
            disabled={nextDisabled || isLoading}
          >
            {isLoading ? 'Sparar...' : nextLabel}
          </Button>
          {showSkip && onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full text-muted-foreground"
              disabled={isLoading}
            >
              {skipLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
