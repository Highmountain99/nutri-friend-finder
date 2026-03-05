import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonalInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PersonalInfoSheet({ open, onOpenChange }: PersonalInfoSheetProps) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setEmail(user.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
        }
      });
  }, [open, user]);

  const handleSaveName = async () => {
    if (!user) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName.trim(), last_name: lastName.trim() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Namn uppdaterat!");
    } catch {
      toast.error("Kunde inte uppdatera namn");
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!user || !email.trim()) return;
    if (email.trim() === user.email) return;
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      toast.success("En bekräftelselänk har skickats till din nya e-post");
    } catch (err: any) {
      toast.error(err.message || "Kunde inte uppdatera e-post");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error("Lösenorden matchar inte");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Lösenordet måste vara minst 6 tecken");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Lösenord uppdaterat!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Kunde inte uppdatera lösenord");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Personuppgifter</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Name section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Namn</h3>
            <div className="space-y-2">
              <Label htmlFor="firstName">Förnamn</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Efternamn</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <Button onClick={handleSaveName} disabled={savingName} size="sm" className="w-full">
              {savingName ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Spara namn
            </Button>
          </section>

          <Separator />

          {/* Email section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">E-post</h3>
            <div className="space-y-2">
              <Label htmlFor="email">E-postadress</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleSaveEmail} disabled={savingEmail || email.trim() === user?.email} size="sm" className="w-full">
              {savingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Ändra e-post
            </Button>
          </section>

          <Separator />

          {/* Password section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lösenord</h3>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nytt lösenord</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minst 6 tecken" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleSavePassword} disabled={savingPassword || !newPassword || !confirmPassword} size="sm" className="w-full">
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Ändra lösenord
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
