import { useState } from "react";
import { Copy, Check, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function CalendarSyncSheet() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const feedUrl = user
    ? `https://${projectId}.supabase.co/functions/v1/calendar-feed?token=${user.id}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    toast.success("Länk kopierad!");
    setTimeout(() => setCopied(false), 2000);
  };

  const googleCalUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Synka kalender
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Kalendersynk
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* iCal feed */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">iCal-prenumeration</h3>
                <Badge variant="secondary" className="text-xs">Alla kalendrar</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Klistra in denna länk i valfri kalenderapp (Apple Kalender, Outlook, etc.) för att automatiskt synka bokningar och lediga tider.
              </p>
              <div className="flex gap-2">
                <Input
                  value={feedUrl}
                  readOnly
                  className="text-xs font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Google Kalender</h3>
                <Badge variant="secondary" className="text-xs">Snabbstart</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Klicka nedan för att direkt lägga till ditt EatSuite-schema i Google Kalender. Bokningar och tillgänglighet uppdateras automatiskt.
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(googleCalUrl, "_blank")}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M18.316 5.684H24V24H0V5.684h5.684" fill="#4285F4"/>
                  <path d="M18.316 0v5.684H5.684V0" fill="#EA4335"/>
                  <path d="M24 5.684V0h-5.684" fill="#FBBC04"/>
                  <path d="M0 5.684V0h5.684" fill="#34A853"/>
                  <path d="M5.684 5.684h12.632V24H5.684z" fill="#fff" fillOpacity=".9"/>
                  <path d="M8.5 10.5h2v2h-2zm0 3.5h2v2h-2zm3.5-3.5h2v2h-2zm0 3.5h2v2h-2z" fill="#4285F4"/>
                </svg>
                Lägg till i Google Kalender
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Apple Calendar */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Apple Kalender</h3>
                <Badge variant="secondary" className="text-xs">macOS / iOS</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Öppna Apple Kalender → Arkiv → Ny kalenderprenumeration → Klistra in länken ovan.
              </p>
            </CardContent>
          </Card>

          {/* Outlook */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Outlook</h3>
                <Badge variant="secondary" className="text-xs">Webb / Desktop</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Outlook Web → Lägg till kalender → Prenumerera från webben → Klistra in länken ovan.
              </p>
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong>OBS:</strong> Kalenderflödet uppdateras automatiskt. De flesta kalenderappar hämtar nya ändringar var 15–60 minut.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
