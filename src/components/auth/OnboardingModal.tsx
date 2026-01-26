import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BankIdLogo } from "./BankIdLogo";
import { startBankId } from "@/lib/bankid";
import { cn } from "@/lib/utils";
interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}
export function OnboardingModal({
  open,
  onClose
}: OnboardingModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  if (!open) return null;
  const handleNext = () => {
    if (currentPage === 0) {
      setCurrentPage(1);
    }
  };
  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      await startBankId("signup");
      // After successful signup, would redirect to app
      onClose();
    } catch (error) {
      console.error("BankID signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPage === 0) {
        setCurrentPage(1);
      } else if (diff < 0 && currentPage === 1) {
        setCurrentPage(0);
      }
    }
    setTouchStart(null);
  };
  const handleClose = () => {
    setCurrentPage(0);
    onClose();
  };
  return <div className="fixed inset-0 z-50 bg-white safe-area-inset">
      {/* Close button */}
      <button onClick={handleClose} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted transition-colors" aria-label="Stäng">
        <X className="h-6 w-6 text-foreground" />
      </button>

      {/* Swipeable content */}
      <div className="h-full overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex h-full transition-transform duration-300 ease-out" style={{
        transform: `translateX(-${currentPage * 100}%)`
      }}>
          {/* Page 1 */}
          <div className="min-w-full h-full flex flex-col">
            <OnboardingPage1 onNext={handleNext} />
          </div>

          {/* Page 2 */}
          <div className="min-w-full h-full flex flex-col">
            <OnboardingPage2 onGetStarted={handleGetStarted} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Page indicators */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1].map(index => <button key={index} onClick={() => setCurrentPage(index)} className={cn("w-2 h-2 rounded-full transition-colors", currentPage === index ? "bg-primary" : "bg-muted")} aria-label={`Gå till sida ${index + 1}`} />)}
      </div>
    </div>;
}
function OnboardingPage1({
  onNext
}: {
  onNext: () => void;
}) {
  return <div className="flex-1 flex flex-col px-6 pt-16">
      {/* Illustration placeholder */}
      <div className="flex-shrink-0 h-48 bg-primary-soft rounded-2xl flex items-center justify-center mb-8">
        <div className="text-primary/50 text-sm">
          Illustration: Person i soffa med mobil
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h2 className="text-2xl font-semibold text-foreground mb-8">
          Dietist i mobilen
        </h2>

        {/* Stats */}
        <div className="space-y-6">
          <StatRow number="100 000+" text="Har genomgått en behandling hos EatSuite" />
          <StatRow number="80 %" text="ser hälsoförbättringar inom 30 dagar" />
          <StatRow number="4,9 av 5" text="är genomsnittsbetyget på våra dietister" />
        </div>
      </div>

      {/* CTA */}
      <div className="py-8 pb-safe">
        <Button onClick={onNext} size="xl" className="w-full h-14 text-base font-medium">
          Nästa
        </Button>
      </div>
    </div>;
}
function OnboardingPage2({
  onGetStarted,
  isLoading
}: {
  onGetStarted: () => void;
  isLoading: boolean;
}) {
  return <div className="flex-1 flex flex-col px-6 pt-16">
      {/* Illustration placeholder */}
      <div className="flex-shrink-0 h-48 bg-primary-soft rounded-2xl flex items-center justify-center mb-8">
        <div className="text-primary/50 text-sm text-center px-4">
          Illustration: Person med mobil, grönsaker och hälsa
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Så här fungerar det
        </h2>

        <ul className="space-y-4 text-foreground/80 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <span>Svara på några frågor för att vi ska ta reda på vad ditt besvär är och om du kvalificerar dig för dietistvård eller om du ska prata med en kostrådgivare.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <span>
              Välj en dietist/kostrådgivare och boka ett första videosamtal där ni reder ut vad du behöver hjälp med.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              3
            </span>
            <span>
              Tillsammans skapar ni en behandlingsplan som passar dig.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <span>
              Mellan samtalen använder du appens näringsspårningsverktyg samt tar del av de mål din dietist sätter upp för dig. Verktyg och mål, särskilt anpassade för att du ska må bättre.
            </span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="py-8 pb-safe">
        <Button onClick={onGetStarted} size="xl" className="w-full h-14 text-base font-medium relative" disabled={isLoading}>
          {isLoading ? "Öppnar BankID…" : "Kom igång"}
          {!isLoading && <span className="absolute right-4 top-1/2 -translate-y-1/2">
              <BankIdLogo className="h-5 w-auto text-primary-foreground" />
            </span>}
        </Button>
      </div>
    </div>;
}
function StatRow({
  number,
  text
}: {
  number: string;
  text: string;
}) {
  return <div>
      <div className="text-2xl font-semibold text-primary">{number}</div>
      <div className="text-sm text-muted-foreground">{text}</div>
    </div>;
}