import { openExternal } from "@/lib/openExternal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId?: string;
  isHost?: boolean;
  devMode?: boolean;
}

export function VideoCallModal({ open, onOpenChange, appointmentId, isHost = false, devMode = false }: VideoCallModalProps) {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && (appointmentId || devMode)) {
      createOrGetRoom();
    }
    if (!open) {
      setRoomUrl(null);
    }
  }, [open, appointmentId, devMode]);

  const createOrGetRoom = async () => {
    if (!appointmentId && !devMode) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Du måste vara inloggad");
        return;
      }

      const res = await supabase.functions.invoke("create-video-room", {
        body: devMode ? { devMode: true } : { appointmentId },
      });

      if (res.error) throw res.error;

      const url = isHost ? (res.data.hostRoomUrl || res.data.roomUrl) : res.data.roomUrl;
      setRoomUrl(url);
    } catch (err) {
      console.error("Error creating video room:", err);
      toast.error("Kunde inte starta videosamtal. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Videosamtal
          </DialogTitle>
          <DialogDescription>
            {roomUrl ? "Ditt videosamtal pågår nedan." : "Startar videosamtal..."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative min-h-0">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Förbereder videosamtal...</p>
            </div>
          ) : roomUrl ? (
            <>
              <iframe
                src={`${roomUrl}?minimal&skipMediaPermissionPrompt`}
                allow="camera; microphone; fullscreen; speaker; display-capture; compute-pressure"
                className="w-full h-full border-0"
                title="Videosamtal"
              />
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 text-xs opacity-70 hover:opacity-100"
                  onClick={() => openExternal(roomUrl)}
                >
                  <ExternalLink className="h-3 w-3" />
                  Öppna i nytt fönster
                </Button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Kunde inte ansluta till videosamtalet.
              </p>
              <Button variant="outline" onClick={createOrGetRoom}>
                Försök igen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
