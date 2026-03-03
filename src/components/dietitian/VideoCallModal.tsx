import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoCallModal({ open, onOpenChange }: VideoCallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Videosamtal
          </DialogTitle>
          <DialogDescription>
            Videosamtal öppnas i ett nytt fönster.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-10 w-10 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Videofunktionen kommer att integreras i en framtida version.
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
