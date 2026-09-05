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
  "Styrketräning och muskeluppbyggnad",
  "Viktminskning och livsstilsförändring",
  "Funktionell träning och vardagsstyrka",
  "Kondition, löpning eller uthållighet",
  "Idrottsspecifik prestationsutveckling",
  "Rörlighet och mobilitet",
  "Seniorträning",
  "Träning under och efter graviditet",
  "Träning för barn och ungdomar",
  "Träning för personer med funktionsnedsättning",
  "Återgång till träning efter skada, i samarbete med fysioterapeut",
  "Smärtanpassad träning, inom PT:ns kompetensområde",
  "Träning vid exempelvis diabetes eller hjärt-kärlsjukdom, med rätt vidareutbildning och vårdkontakt",
  "Kostcoachning och beteendeförändring",
  "Stresshantering, återhämtning och sömnvanor",
  "Onlinecoachning",
  "Företagshälsa och arbetsplatsträning",
  "Gruppträning",
  "Bodybuilding, powerlifting, tyngdlyftning eller CrossFit",
  "Kampsportsfys eller annan sportspecifik fysträning",
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
        specializations: profile.specializations ?? [],
        languages: profile.languages ?? [],
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
      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const ext = extMap[file.type] ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = urlData.publicUrl;

      const { data: updated, error: updateError } = await supabase
        .from("dietitian_profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", profile.id)
        .select("id, avatar_url");
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        throw new Error("Bilden kunde inte sparas på din profil");
      }

      // Uppdatera cachen direkt så bilden syns utan omladdning
      queryClient.setQueryData(["dietitian-profile", user.id], (prev: any) =>
        prev ? { ...prev, avatar_url: avatarUrl } : prev
      );
      queryClient.invalidateQueries({ queryKey: ["dietitian-profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-dietitian"] });
      toast.success("Profilbild uppdaterad!");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err?.message || "Kunde inte ladda upp bilden");
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
          specializations: form.specializations.filter(Boolean),
          languages: form.languages.filter(Boolean),
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
          {/* Specializations multi-select */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Specialiseringar</label>
            <Popover open={specOpen} onOpenChange={setSpecOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal h-auto min-h-10 py-2">
                  <span className="text-sm text-muted-foreground">Välj specialiseringar...</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-64 overflow-y-auto" align="start">
                {SPECIALIZATION_OPTIONS.map((spec) => {
                  const selected = form.specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors ${selected ? "bg-primary/10 text-primary font-medium" : ""}`}
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          specializations: selected
                            ? f.specializations.filter(s => s !== spec)
                            : [...f.specializations, spec],
                        }));
                      }}
                    >
                      {spec}
                    </button>
                  );
                })}
                <div className="border-t p-2 flex gap-2">
                  <Input
                    value={customSpec}
                    onChange={(e) => setCustomSpec(e.target.value)}
                    placeholder="Lägg till egen..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customSpec.trim()) {
                        e.preventDefault();
                        if (!form.specializations.includes(customSpec.trim())) {
                          setForm(f => ({ ...f, specializations: [...f.specializations, customSpec.trim()] }));
                        }
                        setCustomSpec("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    disabled={!customSpec.trim()}
                    onClick={() => {
                      if (customSpec.trim() && !form.specializations.includes(customSpec.trim())) {
                        setForm(f => ({ ...f, specializations: [...f.specializations, customSpec.trim()] }));
                      }
                      setCustomSpec("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {form.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.specializations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="gap-1 pr-1">
                    {spec}
                    <button onClick={() => setForm(f => ({ ...f, specializations: f.specializations.filter(s => s !== spec) }))} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Languages multi-select */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Språk</label>
            <Popover open={langOpen} onOpenChange={(o) => { setLangOpen(o); if (!o) setLangSearch(""); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal h-auto min-h-10 py-2">
                  <span className="text-sm text-muted-foreground">Välj språk...</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Sök språk..."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {LANGUAGE_OPTIONS.filter(l => l.toLowerCase().includes(langSearch.toLowerCase())).map((lang) => {
                    const selected = form.languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors ${selected ? "bg-primary/10 text-primary font-medium" : ""}`}
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            languages: selected
                              ? f.languages.filter(l => l !== lang)
                              : [...f.languages, lang],
                          }));
                        }}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            {form.languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="gap-1 pr-1">
                    {lang}
                    <button onClick={() => setForm(f => ({ ...f, languages: f.languages.filter(l => l !== lang) }))} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
