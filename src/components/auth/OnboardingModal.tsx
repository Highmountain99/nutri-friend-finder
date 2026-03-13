import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import onboardingSofa from "@/assets/onboarding-sofa.png";
import onboardingHealth from "@/assets/onboarding-health.png";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const navigate = useNavigate();
  const {
    signUp
  } = useAuth();
  if (!open) return null;
  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    }
  };
  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Fyll i för- och efternamn");
      return;
    }
    if (!email || !password) {
      toast.error("Fyll i e-post och lösenord");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Lösenorden matchar inte");
      return;
    }
    if (password.length < 6) {
      toast.error("Lösenordet måste vara minst 6 tecken");
      return;
    }
    setIsLoading(true);
    try {
      const {
        error
      } = await signUp(email, password, firstName.trim(), lastName.trim());
      if (error) {
        toast.error(error.message || "Registreringen misslyckades");
        return;
      }
      toast.success("Konto skapat! Du är nu inloggad.");
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error("Ett fel uppstod vid registrering");
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
      if (diff > 0 && currentPage < 2) {
        setCurrentPage(currentPage + 1);
      } else if (diff < 0 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
    setTouchStart(null);
  };
  const handleClose = () => {
    setCurrentPage(0);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    onClose();
  };
  return <div className="fixed inset-0 z-50 bg-white safe-area-inset flex flex-col">
      {/* Close button */}
      <button onClick={handleClose} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted transition-colors" aria-label="Stäng">
        <X className="h-6 w-6 text-foreground" />
      </button>

      {/* Swipeable content */}
      <div className="flex-1 overflow-hidden touch-pan-y" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex h-full transition-transform duration-300 ease-out" style={{
        transform: `translateX(-${currentPage * 100}%)`
      }}>
          {/* Page 1 */}
          <div className="w-full flex-shrink-0 h-full flex flex-col overflow-y-auto">
            <OnboardingPage1 onNext={handleNext} />
          </div>

          {/* Page 2 */}
          <div className="w-full flex-shrink-0 h-full flex flex-col overflow-y-auto">
            <OnboardingPage2 onNext={handleNext} />
          </div>

          {/* Page 3 - Registration */}
          <div className="w-full flex-shrink-0 h-full flex flex-col overflow-y-auto">
            <OnboardingPage3 firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} onGetStarted={handleGetStarted} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Page indicators - fixed at bottom */}
      <div className="flex-shrink-0 py-4 flex justify-center gap-2 pb-safe">
        {[0, 1, 2].map(index => <button key={index} onClick={() => setCurrentPage(index)} className={cn("w-2 h-2 rounded-full transition-colors", currentPage === index ? "bg-primary" : "bg-muted")} aria-label={`Gå till sida ${index + 1}`} />)}
      </div>
    </div>;
}
function OnboardingPage1({
  onNext
}: {
  onNext: () => void;
}) {
  return <div className="flex-1 flex flex-col pt-16">
      {/* Illustration */}
      <div className="flex-shrink-0 h-48 bg-primary-soft flex items-center justify-center mb-8 overflow-hidden">
        <img 
          src={onboardingSofa} 
          alt="Person i soffa med mobil" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        <h2 className="text-2xl font-semibold text-foreground mb-8">Dietist eller kostrådgivning i mobilen</h2>

        {/* Stats */}
        <div className="space-y-6">
          <StatRow number="100 000+" text="Har genomgått en behandling hos Gut Feeling" />
          <StatRow number="80 %" text="ser hälsoförbättringar inom 30 dagar" />
          <StatRow number="4,9 av 5" text="är genomsnittsbetyget på våra dietister" />
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 py-6 px-6">
        <Button onClick={onNext} size="xl" className="w-full h-14 text-base font-medium">
          Nästa
        </Button>
      </div>
    </div>;
}
function OnboardingPage2({
  onNext
}: {
  onNext: () => void;
}) {
  return <div className="flex-1 flex flex-col pt-16">
      {/* Illustration */}
      <div className="flex-shrink-0 h-48 bg-primary-soft flex items-center justify-center mb-8 overflow-hidden">
        <img 
          src={onboardingHealth} 
          alt="Person med mobil, grönsaker och hälsa" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Så här fungerar det
        </h2>

        <ul className="space-y-4 text-foreground/80 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <span>
              Svara på några frågor för att vi ska ta reda på vad ditt besvär är och om du
              kvalificerar dig för dietistvård eller om du ska prata med en kostrådgivare.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <span>
              Välj en dietist/kostrådgivare och boka ett första videosamtal där ni reder ut
              vad du behöver hjälp med.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              3
            </span>
            <span>Tillsammans skapar ni en behandlingsplan som passar dig.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <span>
              Mellan samtalen använder du appens näringsspårningsverktyg samt tar del av de
              mål din dietist sätter upp för dig.
            </span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 py-6 px-6">
        <Button onClick={onNext} size="xl" className="w-full h-14 text-base font-medium">
          Skapa konto
        </Button>
      </div>
    </div>;
}
function OnboardingPage3({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onGetStarted,
  isLoading
}: {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  onGetStarted: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  return <div className="flex-1 flex flex-col px-6 pt-16">
      <div className="flex-1">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Skapa ditt konto
        </h2>
        <p className="text-muted-foreground mb-8">
          Fyll i dina uppgifter för att komma igång.
        </p>

        <form onSubmit={onGetStarted} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="signup-firstname">Förnamn</Label>
              <Input id="signup-firstname" type="text" placeholder="Anna" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isLoading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-lastname">Efternamn</Label>
              <Input id="signup-lastname" type="text" placeholder="Andersson" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isLoading} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">E-post</Label>
            <Input id="signup-email" type="email" placeholder="din@epost.se" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-password">Lösenord</Label>
            <Input id="signup-password" type="password" placeholder="Minst 6 tecken" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} required minLength={6} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Bekräfta lösenord</Label>
            <Input id="signup-confirm" type="password" placeholder="Upprepa lösenord" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} required minLength={6} />
          </div>

          <div className="pt-4">
            <Button type="submit" size="xl" className="w-full h-14 text-base font-medium" disabled={isLoading}>
              {isLoading ? "Skapar konto…" : "Kom igång"}
            </Button>
          </div>
        </form>
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