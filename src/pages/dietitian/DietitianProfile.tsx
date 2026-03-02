import { useDietitianProfile } from "@/hooks/dietitian/useDietitianProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function DietitianProfile() {
  const { data: profile, isLoading } = useDietitianProfile();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    title: "",
    bio: "",
    specializations: "",
    languages: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        title: profile.title,
        bio: profile.bio ?? "",
        specializations: (profile.specializations ?? []).join(", "),
        languages: (profile.languages ?? []).join(", "),
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("dietitian_profiles")
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          title: form.title,
          bio: form.bio || null,
          specializations: form.specializations.split(",").map((s) => s.trim()).filter(Boolean),
          languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        })
        .eq("id", profile!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-profile"] });
      toast.success("Profil uppdaterad!");
    },
    onError: () => toast.error("Kunde inte uppdatera profilen"),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Ingen dietistprofil hittad. Kontakta administratören.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Min profil</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Personuppgifter</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Förnamn</label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Efternamn</label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Titel</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Specialiseringar (kommaseparerade)</label>
            <Input value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} placeholder="Diabetes, viktnedgång, IBS" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Språk (kommaseparerade)</label>
            <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="Svenska, engelska" />
          </div>
          <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="w-full">
            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Spara ändringar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
