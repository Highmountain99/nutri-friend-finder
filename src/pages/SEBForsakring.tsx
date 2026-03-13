import { HelpCircle, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SEBForsakring() {
  const [claimNumber, setClaimNumber] = useState("");

  const handleSave = () => {
    if (!claimNumber.trim()) {
      toast.error("Ange ett skadenummer");
      return;
    }
    toast.success("Uppgifterna har sparats");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-lg font-semibold text-foreground">SEB Försäkring</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Illustration/Hero */}
        <div className="flex flex-col items-center py-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground text-center">
            SEB + Gut Feeling
          </h2>
          <p className="text-muted-foreground text-center mt-2 max-w-sm">
            Genom SEB:s försäkring har du tillgång till kostrådgivning via Gut Feeling
          </p>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Om samarbetet
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hjälp</DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                      <p>
                        Om du har en försäkring genom SEB som inkluderar kostrådgivning 
                        kan du använda Gut Feeling utan extra kostnad.
                      </p>
                      <p>
                        <strong>Skadenummer</strong> hittar du i ditt försäkringsbrev eller 
                        genom att kontakta SEB:s kundtjänst.
                      </p>
                      <p>
                        <strong>Försäkringsnummer</strong> finns på ditt försäkringsbrev 
                        eller i Mina sidor på seb.se.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              SEB:s kunder med rätt försäkring får tillgång till dietistrådgivning 
              och kostvägledning genom Gut Feeling. Ange ditt skadenummer nedan för 
              att aktivera din förmån.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claim-number">Skadenummer / Försäkringsnummer</Label>
              <Input
                id="claim-number"
                placeholder="T.ex. 123456789"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button className="w-full" onClick={handleSave}>
          Spara
        </Button>
      </div>
    </div>
  );
}
