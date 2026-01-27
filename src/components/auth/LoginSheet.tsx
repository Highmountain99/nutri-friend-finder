import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface LoginSheetProps {
  open: boolean;
  onClose: () => void;
}

export function LoginSheet({ open, onClose }: LoginSheetProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

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
      navigate("/");
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
              disabled={isLoading}
            >
              {isLoading ? "Loggar in…" : "Logga in"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
