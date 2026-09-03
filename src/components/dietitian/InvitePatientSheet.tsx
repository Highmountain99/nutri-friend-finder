import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, Send, Link2, Mail, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { APP_BASE_URL } from "@/lib/appUrl";

interface InvitePatientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitePatientSheet({ open, onOpenChange }: InvitePatientSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch dietitian profile for name slug
  const { data: dietitianProfile } = useQuery({
    queryKey: ["dietitian-profile-slug", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("dietitian_profiles")
        .select("first_name, last_name")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user && open,
  });

  // Get or create a general invite link for this dietitian
  const { data: generalInvite, isLoading: loadingGeneral } = useQuery({
    queryKey: ["dietitian-general-invite", user?.id],
    queryFn: async () => {
      // Look for existing general invite (no email)
      const { data, error } = await supabase
        .from("patient_invitations" as any)
        .select("*")
        .eq("dietitian_id", user!.id)
        .is("patient_email", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) return data[0] as any;

      // Create one
      const { data: newInvite, error: insertError } = await supabase
        .from("patient_invitations" as any)
        .insert({ dietitian_id: user!.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return newInvite as any;
    },
    enabled: !!user && open,
  });

  // List sent email invites
  const { data: emailInvites } = useQuery({
    queryKey: ["dietitian-email-invites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_invitations" as any)
        .select("*")
        .eq("dietitian_id", user!.id)
        .not("patient_email", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && open,
  });

  const sendEmailInvite = useMutation({
    mutationFn: async (patientEmail: string) => {
      const { error } = await supabase
        .from("patient_invitations" as any)
        .insert({
          dietitian_id: user!.id,
          patient_email: patientEmail,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inbjudan skapad!");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["dietitian-email-invites"] });
    },
    onError: () => toast.error("Kunde inte skapa inbjudan"),
  });

  const inviteUrl = generalInvite
    ? `${APP_BASE_URL}/i/${(generalInvite as any).invite_code}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Länk kopierad!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Ange en giltig e-postadress");
      return;
    }
    sendEmailInvite.mutate(email.trim());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Bjud in klient
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* General invite link */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <Label className="font-medium">Din inbjudningslänk</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Dela denna länk med klienter. De som registrerar sig via länken kopplas automatiskt till dig.
            </p>
            {loadingGeneral ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Laddar...
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="text-xs bg-muted/50"
                />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          {/* Email invite */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <Label className="font-medium">Skicka inbjudan via e-post</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Ange klientens e-postadress. En personlig inbjudningslänk skapas automatiskt.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="klient@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              />
              <Button
                onClick={handleSendEmail}
                disabled={sendEmailInvite.isPending}
              >
                {sendEmailInvite.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Sent invites list */}
          {emailInvites && emailInvites.length > 0 && (
            <div className="space-y-3 border-t pt-6">
              <Label className="font-medium">Skickade inbjudningar</Label>
              <div className="space-y-2">
                {emailInvites.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <div>
                      <p className="font-medium">{inv.patient_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inv.created_at), "d MMM yyyy", { locale: sv })}
                      </p>
                    </div>
                    <Badge
                      variant={inv.status === "accepted" ? "default" : "secondary"}
                      className={
                        inv.status === "accepted"
                          ? "bg-primary/10 text-primary border-0"
                          : ""
                      }
                    >
                      {inv.status === "accepted" ? "Accepterad" : "Väntande"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
