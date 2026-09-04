import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

interface LoginSheetProps {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

const PAPER = "#F7F3EA";
const INK = "#1F2A22";
const GREEN = "#1F3A2E";
const GREEN_DEEP = "#142319";
const GREEN_SOFT = "#2D4F3E";
const BEIGE = "#EBE5D6";
const FIELD = "#E8E1D0";
const FIELD_BORDER = "rgba(31,42,34,0.14)";
const LINE_STRONG = "rgba(31,42,34,0.34)";
const FS = 'MentiDisplay, Anton, sans-serif';
const FN = "MentiText, Manrope, ui-sans-serif, system-ui, sans-serif";

export function LoginSheet({ open, onClose, redirectTo = "/home" }: LoginSheetProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/home";

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${safeRedirect}`,
      });
      if (redirected) return;
      if (error) {
        toast.error(error.message || "Google-inloggning misslyckades");
        return;
      }
      onClose();
      navigate(safeRedirect);
    } catch {
      toast.error("Ett fel uppstod vid Google-inloggning");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}${safeRedirect}`,
      });
      if (redirected) return;
      if (error) {
        toast.error(error.message || "Apple-inloggning misslyckades");
        return;
      }
      onClose();
      navigate(safeRedirect);
    } catch {
      toast.error("Ett fel uppstod vid Apple-inloggning");
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Fyll i e-post och lösenord");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || "Inloggningen misslyckades");
        return;
      }
      onClose();
      navigate(safeRedirect);
    } catch {
      toast.error("Ett fel uppstod vid inloggning");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[55]"
        style={{
          background: "rgba(20,35,25,0.34)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .3s",
        }}
      />
      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[56] safe-area-inset"
        style={{
          background: PAPER,
          borderRadius: "26px 26px 0 0",
          padding: "14px 26px 30px",
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: "transform .42s cubic-bezier(.16,1,.3,1)",
          boxShadow: "0 -24px 60px -28px rgba(20,35,25,0.5)",
        }}
      >
        <div
          className="mx-auto"
          style={{ width: 42, height: 4, borderRadius: 4, background: LINE_STRONG, opacity: 0.5, marginBottom: 18 }}
        />
        <h2
          className="m-0"
          style={{
            fontFamily: FS,
            fontWeight: 400,
            fontSize: 30,
            lineHeight: 1.04,
            color: GREEN_DEEP,
            marginBottom: 18,
          }}
        >
          Logga in
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-[14px]">
          <SheetField
            label="E-post"
            type="email"
            placeholder="din@epost.se"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={isLoading}
          />
          <SheetField
            label="Lösenord"
            type="password"
            placeholder="Ditt lösenord"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full rounded-full font-semibold transition-transform active:scale-[0.98] mt-2"
            style={{
              padding: "17px 20px",
              background: GREEN_DEEP,
              color: BEIGE,
              fontFamily: FN,
              fontSize: 16.5,
              opacity: isLoading || isGoogleLoading ? 0.6 : 1,
              boxShadow: "0 10px 26px -14px rgba(20,35,25,0.7)",
            }}
          >
            {isLoading ? "Loggar in…" : "Logga in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <span className="flex-1 h-px" style={{ background: FIELD_BORDER }} />
          <span
            style={{
              fontFamily: 'MentiText, Manrope, sans-serif',
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

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          className="w-full rounded-full flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
          style={{
            padding: "15px 20px",
            background: "transparent",
            border: `1.5px solid ${LINE_STRONG}`,
            color: GREEN_DEEP,
            fontFamily: FN,
            fontSize: 15.5,
            fontWeight: 600,
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

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3"
          style={{ background: "transparent", fontFamily: FN, fontSize: 14, color: GREEN_SOFT, padding: 8 }}
        >
          Glömt lösenord?
        </button>
      </div>
    </>
  );
}

function SheetField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  const border = focus ? GREEN : FIELD_BORDER;
  return (
    <label className="flex flex-col gap-2">
      <span style={{ fontFamily: FN, fontSize: 14, fontWeight: 600, color: GREEN_DEEP }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="w-full box-border outline-none"
        style={{
          padding: "15px 16px",
          border: `1.5px solid ${border}`,
          borderRadius: 14,
          background: FIELD,
          fontFamily: FN,
          fontSize: 16,
          color: INK,
          boxShadow: focus ? "0 0 0 4px rgba(31,58,46,0.12)" : "none",
          transition: "border-color .18s, box-shadow .18s",
        }}
      />
    </label>
  );
}
