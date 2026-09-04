import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveMealImageUrl } from "@/lib/mealImages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ImageOff } from "lucide-react";

interface Props {
  mealId: string | null;
  mealName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MealImagePreviewDialog({ mealId, mealName, open, onOpenChange }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !mealId) return;
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);
    (async () => {
      const { data } = await supabase
        .from("nutrition_entries")
        .select("image_url")
        .eq("id", mealId)
        .maybeSingle();
      if (!cancelled) {
        setImageUrl(await resolveMealImageUrl(data?.image_url));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mealId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{mealName || "Måltid"}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[240px] rounded-xl bg-muted/40 overflow-hidden">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : imageUrl ? (
            <img src={imageUrl} alt={mealName || "Måltid"} className="w-full h-auto object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-10">
              <ImageOff className="h-6 w-6" />
              <p className="text-sm">Ingen bild för denna måltid</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
