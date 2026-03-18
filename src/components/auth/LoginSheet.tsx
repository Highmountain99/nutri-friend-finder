import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface LoginSheetProps {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function LoginSheet({ open, onClose, redirectTo = "/home" }: LoginSheetProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/home";

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${safeRedirect}`,
      });
      
      if (redirected) {
        // User is being redirected to Google
        return;
      }
      
      if (error) {
        toast.error(error.message || "Google-inloggning misslyckades");
        return;
      }
      
      onClose();
      navigate(safeRedirect);
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error("Ett fel uppstod vid Google-inloggning");
    } finally {
      setIsGoogleLoading(false);
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
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Ett fel uppstod vid inloggning");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl px-6 pb-safe pt-8"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Header */}
          <SheetHeader className="space-y-2">
            <SheetTitle className="text-xl font-semibold">
              Logga in
            </SheetTitle>
            <SheetDescription>
              Ange din e-post och lösenord för att logga in.
            </SheetDescription>
          </SheetHeader>

          {/* Login form */}
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@epost.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              size="xl"
              className="w-full h-14 text-base font-medium"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? "Loggar in…" : "Logga in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative w-full">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-sm text-muted-foreground">
              eller
            </span>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            size="xl"
            className="w-full h-14 text-base font-medium gap-3"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
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
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
