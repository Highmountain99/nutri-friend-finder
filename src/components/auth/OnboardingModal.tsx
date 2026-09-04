import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import onboardingSofa from "@/assets/onboarding-sofa.png";
import onboardingHealth from "@/assets/onboarding-health.png";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const PAPER = "#F7F3EA";
const INK = "#1F2A22";
const GREEN = "#1F3A2E";
const GREEN_DEEP = "#142319";
const GREEN_SOFT = "#2D4F3E";
const SAGE_DEEP = "#6F8A6C";
const BEIGE = "#EBE5D6";
const FIELD = "#E8E1D0";
const FIELD_BORDER = "rgba(31,42,34,0.14)";
const LINE = "rgba(31,42,34,0.12)";
const CORAL = "#C4564E";
const OK = "#3C7A55";
const FS = 'MentiDisplay, Anton, sans-serif';
const FN = "MentiText, Manrope, ui-sans-serif, system-ui, sans-serif";
const FM = 'MentiText, Manrope, sans-serif';

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const [welcome, setWelcome] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setMounted(true);
      setVisible(false);
      // Double RAF so the initial translateY(100%) paints before transitioning.
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setVisible(true));
        (window as any).__onb_raf2 = r2;
      });
      return () => {
        cancelAnimationFrame(r1);
        if ((window as any).__onb_raf2) cancelAnimationFrame((window as any).__onb_raf2);
      };
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        setPage(0);
        setWelcome(false);
      }, 520);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClose = () => onClose();
  const handleStart = () => {
    onClose();
    navigate("/home");
  };

  if (!mounted) return null;

  return (
    <>
      {/* Onboarding sheet */}
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        style={{
          background: PAPER,
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -22px 60px -30px rgba(20,35,25,0.45)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform .52s cubic-bezier(.16,1,.3,1)",
          willChange: "transform",
        }}
      >
        <FormScreen
          onClose={handleClose}
          onDone={(n) => {
            setName(n);
            setWelcome(true);
          }}
        />
      </div>

      {/* Welcome sheet */}
      <div
        className="fixed inset-0 z-[60] overflow-hidden"
        style={{
          background: PAPER,
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -22px 60px -30px rgba(20,35,25,0.45)",
          transform: welcome && visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform .52s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <WelcomeScreen
          name={name}
          onStart={handleStart}
        />
      </div>
    </>
  );
}

/* ----- Top bar ----- */
function TopBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end" style={{ padding: "6px 6px 0" }}>
      <button
        onClick={onClose}
        aria-label="Stäng"
        className="grid place-items-center rounded-full"
        style={{ width: 42, height: 42, color: GREEN_DEEP }}
      >
        <X className="w-[22px] h-[22px]" strokeWidth={1.8} />
      </button>
    </div>
  );
}

/* ----- Heading ----- */
function Heading({ children, size, style }: { children: React.ReactNode; size: number; style?: React.CSSProperties }) {
  return (
    <h1
      className="m-0"
      style={{
        fontFamily: FS,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.04,
        color: GREEN_DEEP,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

/* ----- Primary / Ghost buttons ----- */
function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
      style={{
        padding: "13px 18px",
        background: GREEN_DEEP,
        color: BEIGE,
        fontFamily: FN,
        fontSize: 15,
        fontWeight: 600,
        opacity: disabled ? 0.42 : 1,
        boxShadow: disabled ? "none" : "0 10px 26px -14px rgba(20,35,25,0.7)",
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-full transition-transform active:scale-[0.98]"
      style={{
        padding: "13px 18px",
        background: "transparent",
        border: "1.5px solid rgba(31,42,34,0.34)",
        color: GREEN_DEEP,
        fontFamily: FN,
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

/* ----- Dots indicator ----- */
function Dots({ active, total }: { active: number; total: number }) {
  const DOT = 8;
  const GAP = 14;
  const PITCH = DOT + GAP;
  const W = (total - 1) * PITCH + DOT;
  const PILL_W = 24;
  const center = active * PITCH + DOT / 2;
  return (
    <div className="relative" style={{ width: W, height: DOT }}>
      {Array.from({ length: total }).map((_, k) => (
        <span
          key={k}
          className="absolute top-0"
          style={{
            left: k * PITCH,
            width: DOT,
            height: DOT,
            borderRadius: DOT,
            background: k < active ? SAGE_DEEP : "rgba(31,42,34,0.2)",
          }}
        />
      ))}
      <span
        className="absolute top-0"
        style={{
          left: center - PILL_W / 2,
          width: PILL_W,
          height: DOT,
          borderRadius: DOT,
          background: GREEN,
          transition: "left .4s cubic-bezier(.16,1,.3,1)",
        }}
      />
    </div>
  );
}

/* ----- Illustration slot ----- */
function IllustrationSlot({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="w-full overflow-hidden flex-shrink-0 grid place-items-center"
      style={{
        height: 140,
        borderRadius: 18,
        background: "#ECE6D7",
        border: `1px solid ${LINE}`,
      }}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" style={{ mixBlendMode: "multiply" }} />
    </div>
  );
}

/* ----- Pager (swipe between 3 pages) ----- */
function Pager({
  page,
  setPage,
  count,
  children,
}: {
  page: number;
  setPage: (p: number) => void;
  count: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [frac, setFrac] = useState(0);
  const [dragging, setDragging] = useState(false);
  const g = useRef<{ x: number; y: number; axis: "h" | "v" | null; id: number; frac?: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    g.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (s.axis === "h") {
        setDragging(true);
        try {
          ref.current?.setPointerCapture(s.id);
        } catch {}
      }
    }
    if (s.axis !== "h") return;
    const w = ref.current?.getBoundingClientRect().width || 1;
    let f = dx / w;
    if ((page === 0 && f > 0) || (page === count - 1 && f < 0)) f *= 0.32;
    s.frac = f;
    setFrac(f);
  };
  const onUp = () => {
    const s = g.current;
    let landed = page;
    if (s && s.axis === "h") {
      const TH = 0.18;
      const f = s.frac || 0;
      if (f < -TH && page < count - 1) landed = page + 1;
      else if (f > TH && page > 0) landed = page - 1;
    }
    if (landed !== page) setPage(landed);
    g.current = null;
    setDragging(false);
    setFrac(0);
  };

  const unit = 100 / count;
  const pct = -(page - frac) * unit;
  const kids = Array.isArray(children) ? children : [children];

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="flex h-full"
        style={{
          width: `${count * 100}%`,
          transform: `translateX(${pct}%)`,
          transition: dragging ? "none" : "transform .46s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {kids.map((c, i) => (
          <div key={i} className="relative h-full flex-shrink-0" style={{ width: `${unit}%` }}>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----- Screen: Value ----- */
const STATS = [
  { big: "100 000+", small: "har genomgått en behandling hos Gutfeeling" },
  { big: "80 %", small: "ser hälsoförbättringar inom 30 dagar" },
  { big: "4,9 av 5", small: "är genomsnittsbetyget på våra coacher" },
];
function ValueScreen({ onNext, onClose }: { onNext: () => void; onClose: () => void }) {
  return (
    <div className="h-full box-border flex flex-col" style={{ padding: "28px 22px 72px" }}>
      <TopBar onClose={onClose} />
      <div className="flex-1 min-h-0" style={{ paddingTop: 20 }}>
        <Heading size={26} style={{ marginBottom: 20, maxWidth: "15ch" }}>
          Coach eller kostrådgivning i mobilen
        </Heading>
        <div className="flex flex-col gap-4">
          {STATS.map((s, k) => (
            <div key={k}>
              <div style={{ fontFamily: FS, fontSize: 28, lineHeight: 0.95, color: GREEN, letterSpacing: "-0.01em" }}>
                {s.big}
              </div>
              <div style={{ fontFamily: FN, fontSize: 13, color: GREEN_SOFT, marginTop: 4, maxWidth: "30ch" }}>
                {s.small}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center" style={{ paddingTop: 14 }}>
        <PrimaryBtn onClick={onNext}>Nästa</PrimaryBtn>
      </div>
    </div>
  );
}

/* ----- Screen: How ----- */
const STEPS = [
  "Svara på några frågor så att vi förstår ditt besvär och om du kvalificerar dig för dietistvård eller kostrådgivning.",
  "Välj en dietist eller kostrådgivare och boka ett första videosamtal där ni reder ut vad du behöver hjälp med.",
  "Tillsammans skapar ni en behandlingsplan som passar just dig.",
  "Mellan samtalen använder du appens näringsspårning och följer de mål din coach sätter upp.",
];
function HowScreen({ onNext, onClose }: { onNext: () => void; onClose: () => void }) {
  return (
    <div className="h-full box-border flex flex-col" style={{ padding: "28px 22px 72px" }}>
      <TopBar onClose={onClose} />
      <div className="flex-1 min-h-0" style={{ paddingTop: 18 }}>
        <Heading size={26} style={{ marginBottom: 16 }}>
          Så här fungerar det
        </Heading>
        <div className="flex flex-col gap-[12px]">
          {STEPS.map((t, k) => (
            <div key={k} className="flex gap-[12px] items-start">
              <span
                className="flex-shrink-0 grid place-items-center"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: GREEN,
                  color: BEIGE,
                  fontFamily: FS,
                  fontSize: 14,
                  marginTop: 1,
                }}
              >
                {k + 1}
              </span>
              <p className="m-0" style={{ fontFamily: FN, fontSize: 13.5, lineHeight: 1.45, color: INK }}>
                {t}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center" style={{ paddingTop: 14 }}>
        <PrimaryBtn onClick={onNext}>Skapa konto</PrimaryBtn>
      </div>
    </div>
  );
}

/* ----- Field ----- */
function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  valid,
  trailing,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  valid?: boolean;
  trailing?: React.ReactNode;
  autoComplete?: string;
}) {
  const [focus, setFocus] = useState(false);
  const border = error ? CORAL : focus ? GREEN : FIELD_BORDER;
  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ fontFamily: FN, fontSize: 13, fontWeight: 600, color: GREEN_DEEP }}>{label}</span>
      <span className="relative flex items-center">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className="w-full box-border outline-none"
          style={{
            padding: "11px 14px",
            paddingRight: trailing || valid ? 40 : 14,
            border: `1.5px solid ${border}`,
            borderRadius: 12,
            background: FIELD,
            fontFamily: FN,
            fontSize: 14,
            color: INK,
            boxShadow: focus
              ? `0 0 0 4px ${error ? "rgba(196,86,78,0.14)" : "rgba(31,58,46,0.12)"}`
              : "none",
            transition: "border-color .18s, box-shadow .18s",
          }}
        />
        {trailing && (
          <span className="absolute right-2 flex" style={{ color: GREEN_SOFT }}>
            {trailing}
          </span>
        )}
        {!trailing && valid && (
          <span className="absolute right-3 flex" style={{ color: OK }}>
            <Check className="w-[16px] h-[16px]" />
          </span>
        )}
      </span>
      {error && <span style={{ fontFamily: FN, fontSize: 12.5, color: CORAL }}>{error}</span>}
    </label>
  );
}

/* ----- Screen: Form (Create account) ----- */
function FormScreen({ onClose, onDone }: { onClose: () => void; onDone: (firstName: string) => void }) {
  const { signUp } = useAuth();
  const [f, setF] = useState({ first: "", last: "", email: "", pw: "", pw2: "" });
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  const pwOk = f.pw.length >= 6;
  const matchOk = f.pw2.length > 0 && f.pw === f.pw2;
  const allOk = !!f.first.trim() && !!f.last.trim() && emailOk && pwOk && matchOk;

  const strength = (() => {
    let s = 0;
    if (f.pw.length >= 6) s++;
    if (f.pw.length >= 10) s++;
    if (/[0-9]/.test(f.pw) && /[a-zA-ZåäöÅÄÖ]/.test(f.pw)) s++;
    if (/[^a-zA-Z0-9]/.test(f.pw)) s++;
    return Math.min(s, 3);
  })();
  const strengthLabel = ["Svagt", "Okej", "Bra", "Starkt"][strength];

  const socialDisabled = loading || isGoogleLoading;

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (redirected) return;
      if (error) {
        toast.error(error.message || "Google-registrering misslyckades");
        return;
      }
      onClose();
    } catch {
      toast.error("Ett fel uppstod vid Google-registrering");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const submit = async () => {
    setTouched(true);
    if (!allOk) return;
    setLoading(true);
    try {
      const { error } = await signUp(f.email, f.pw, f.first.trim(), f.last.trim());
      if (error) {
        toast.error(error.message || "Registreringen misslyckades");
        return;
      }
      onDone(f.first.trim());
    } catch (e) {
      toast.error("Ett fel uppstod vid registrering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full box-border flex flex-col" style={{ padding: "28px 22px 72px" }}>
      <TopBar onClose={onClose} />
      <div className="flex-1 min-h-0" style={{ paddingTop: 4 }}>
        <Heading size={26} style={{ marginBottom: 6 }}>
          Skapa ditt konto
        </Heading>
        <p className="m-0" style={{ marginBottom: 18, fontFamily: FN, fontSize: 13.5, color: GREEN_SOFT }}>
          Fyll i dina uppgifter för att komma igång.
        </p>

        {/* Social signup */}
        <div className="flex flex-col gap-3" style={{ marginBottom: 18 }}>
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={socialDisabled}
            className="w-full rounded-full flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
            style={{
              padding: "13px 18px",
              background: "transparent",
              border: `1.5px solid ${FIELD_BORDER}`,
              color: GREEN_DEEP,
              fontFamily: FN,
              fontSize: 14.5,
              fontWeight: 600,
              opacity: socialDisabled ? 0.6 : 1,
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isGoogleLoading ? "Ansluter…" : "Fortsätt med Google"}
          </button>

        </div>

        {/* Divider */}
        <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
          <span className="flex-1 h-px" style={{ background: FIELD_BORDER }} />
          <span
            style={{
              fontFamily: FN,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: GREEN_SOFT,
            }}
          >
            eller
          </span>
          <span className="flex-1 h-px" style={{ background: FIELD_BORDER }} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <Field
                label="Förnamn"
                placeholder="Anna"
                value={f.first}
                onChange={set("first")}
                autoComplete="given-name"
                valid={!!f.first.trim()}
                error={touched && !f.first.trim() ? "Fyll i förnamn" : ""}
              />
            </div>
            <div className="flex-1">
              <Field
                label="Efternamn"
                placeholder="Andersson"
                value={f.last}
                onChange={set("last")}
                autoComplete="family-name"
                valid={!!f.last.trim()}
                error={touched && !f.last.trim() ? "Fyll i efternamn" : ""}
              />
            </div>
          </div>

          <Field
            label="E-post"
            type="email"
            placeholder="din@epost.se"
            value={f.email}
            onChange={set("email")}
            autoComplete="email"
            valid={emailOk}
            error={touched && !emailOk ? "Ange en giltig e-postadress" : ""}
          />

          <div>
            <Field
              label="Lösenord"
              type={showPw ? "text" : "password"}
              placeholder="Minst 6 tecken"
              value={f.pw}
              onChange={set("pw")}
              autoComplete="new-password"
              error={touched && !pwOk ? "Minst 6 tecken" : ""}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label="Visa lösenord"
                  className="p-2 flex"
                >
                  {showPw ? (
                    <EyeOff className="w-[19px] h-[19px]" strokeWidth={1.6} />
                  ) : (
                    <Eye className="w-[19px] h-[19px]" strokeWidth={1.6} />
                  )}
                </button>
              }
            />
            {f.pw.length > 0 && (
              <div className="flex items-center gap-[10px] mt-[10px]">
                <div className="flex gap-[5px] flex-1">
                  {[0, 1, 2].map((b) => (
                    <span
                      key={b}
                      className="flex-1"
                      style={{
                        height: 4,
                        borderRadius: 4,
                        background:
                          b < strength
                            ? strength >= 3
                              ? OK
                              : strength === 2
                              ? GREEN
                              : CORAL
                            : "rgba(31,42,34,0.14)",
                        transition: "background .25s",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-right"
                  style={{
                    fontFamily: FM,
                    fontSize: 10.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: GREEN_SOFT,
                    minWidth: 46,
                  }}
                >
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          <Field
            label="Bekräfta lösenord"
            type={showPw ? "text" : "password"}
            placeholder="Upprepa lösenord"
            value={f.pw2}
            onChange={set("pw2")}
            autoComplete="new-password"
            valid={matchOk}
            error={touched && !!f.pw2 && !matchOk ? "Lösenorden matchar inte" : ""}
          />

          {/* Hidden submit for Enter key */}
          <button type="submit" hidden />
        </form>
      </div>
      <div className="flex justify-center" style={{ paddingTop: 14 }}>
        <PrimaryBtn onClick={submit} disabled={loading || (touched && !allOk)}>
          {loading ? "Skapar konto…" : "Kom igång"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

/* ----- Screen: Welcome ----- */
function WelcomeScreen({
  name,
  onStart,
}: {
  name: string;
  onStart: () => void;
}) {
  return (
    <div className="h-full box-border flex flex-col" style={{ padding: "48px 30px 36px" }}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div
          className="grid place-items-center mb-7 animate-in zoom-in duration-500"
          style={{ width: 84, height: 84, borderRadius: "50%", background: GREEN }}
        >
          <Check className="w-[42px] h-[42px]" strokeWidth={2.2} style={{ color: BEIGE }} />
        </div>
        <Heading size={42} style={{ marginBottom: 12 }}>
          Välkommen{name ? `, ${name}` : ""}!
        </Heading>
        <p
          className="m-0"
          style={{ fontFamily: FN, fontSize: 16, lineHeight: 1.5, color: GREEN_SOFT, maxWidth: "26ch" }}
        >
          Ditt konto är skapat. Nu kan du börja logga din mat och följa din utveckling.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <PrimaryBtn onClick={onStart}>
          Kom igång
          <ArrowRight className="w-[18px] h-[18px]" />
        </PrimaryBtn>
      </div>
    </div>
  );
}
