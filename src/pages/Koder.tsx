import { ExternalLink } from "lucide-react";
import { openExternal } from "@/lib/openExternal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Koder() {
  const [code, setCode] = useState("");

  const handleSave = () => {
    if (!code.trim()) {
      toast.error("Ange en kod");
      return;
    }
    toast.success("Koden har sparats");
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-lg font-semibold text-foreground">Koder</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Code Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ange kod</CardTitle>
            <CardDescription>
              Har du fått en kod från din arbetsgivare eller försäkringsbolag? 
              Ange den här för att aktivera din förmån.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kod från arbetsgivare/försäkring</Label>
              <Input
                id="code"
                placeholder="Ange din kod här"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Private Offer Link */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <button
              onClick={() => openExternal("https://eatsuite.se/privat")}
              className="flex items-center justify-between w-full text-left"
            >
              <div>
                <p className="font-medium text-foreground">Privat erbjudande</p>
                <p className="text-sm text-muted-foreground">
                  Läs mer om våra privata alternativ
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </button>
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
