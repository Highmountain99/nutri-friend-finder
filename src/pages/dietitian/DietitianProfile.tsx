import { useDietitianProfile } from "@/hooks/dietitian/useDietitianProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Save, Camera, X, ChevronDown, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const SPECIALIZATION_OPTIONS = [
  "IBS", "Viktnedgång", "Diabetes typ 1", "Diabetes typ 2", "Ätstörningar",
  "Hjärt- och kärlsjukdom", "Celiaki", "Allergi & intolerans", "PCOS",
  "Graviditet & amning", "Idrottsnutrition", "Barnnutrition", "Geriatrik",
  "Vegansk/vegetarisk kost", "Njursjukdom", "Leversjukdom", "Onkologi",
  "Obesitas", "Magtarmsjukdomar", "Emotionellt ätande", "Klimakteriet",
];

const LANGUAGE_OPTIONS = [
  "Svenska", "Engelska", "Arabiska", "Persiska", "Somaliska", "Finska",
  "Norska", "Danska", "Tyska", "Franska", "Spanska", "Portugisiska",
  "Italienska", "Ryska", "Polska", "Turkiska", "Kinesiska (mandarin)",
  "Hindi", "Urdu", "Bengaliska", "Japanska", "Koreanska", "Thailändska",
  "Vietnamesiska", "Grekiska", "Nederländska", "Rumänska", "Ungerska",
  "Tjeckiska", "Kroatiska", "Serbiska", "Bosniska", "Albanska", "Kurdiska",
  "Tigrinja", "Amhariska", "Swahili",
];

export default function DietitianProfile() {
  const { data: profile, isLoading } = useDietitianProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [customSpec, setCustomSpec] = useState("");
  const [specOpen, setSpecOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    title: "",
    bio: "",
    specializations: [] as string[],
    languages: [] as string[],
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Bara JPG, PNG eller WebP tillåts");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Bilden får inte vara större än 5 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("dietitian_profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", profile.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["dietitian-profile"] });
      toast.success("Profilbild uppdaterad!");
    } catch (err: any) {
      toast.error(err.message || "Kunde inte ladda upp bilden");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
        <CardHeader><CardTitle className="text-sm">Profilbild</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Ladda upp foto</p>
            <p className="text-xs text-muted-foreground">JPG, PNG eller WebP. Max 5 MB.</p>
          </div>
        </CardContent>
      </Card>

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
