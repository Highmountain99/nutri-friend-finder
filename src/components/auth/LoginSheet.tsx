import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BankIdLogo } from "./BankIdLogo";
import { startBankId } from "@/lib/bankid";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface LoginSheetProps {
  open: boolean;
  onClose: () => void;
}

export function LoginSheet({ open, onClose }: LoginSheetProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await startBankId("login");
      // After successful login, would redirect to app
      onClose();
    } catch (error) {
      console.error("BankID login failed:", error);
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
          {/* BankID Logo */}
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <BankIdLogo className="h-8 w-auto text-primary" />
          </div>

          {/* Header */}
          <SheetHeader className="space-y-2">
            <SheetTitle className="text-xl font-semibold">
              Logga in med BankID
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Om du inte redan har ett konto skapas ett åt dig.
            </p>
          </SheetHeader>

          {/* Login button */}
          <Button
            onClick={handleLogin}
            size="xl"
            className="w-full h-14 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Öppnar BankID…" : "Logga in"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
