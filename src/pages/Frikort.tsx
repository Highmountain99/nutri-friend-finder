import { CreditCard, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Frikort() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-lg font-semibold text-foreground">Frikort</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Frikort Card */}
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Frikortsnummer</p>
                  <p className="text-lg font-semibold text-foreground">1234 5678 9012</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Utgångsdatum</p>
                  <p className="text-lg font-semibold text-foreground">2026-12-31</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Accordion */}
        <div className="space-y-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is-frikort" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Vad innebär frikort?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ett frikort innebär att du har betalat upp till högkostnadsskyddet för 
                öppenvård under en 12-månadersperiod. Med frikort betalar du inte 
                patientavgift för besök i öppenvården under resten av perioden. 
                Högkostnadsskyddet är för närvarande 1 400 kronor.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-to-know" className="border rounded-lg px-4 mt-2">
              <AccordionTrigger className="text-left">
                Hur vet jag om jag har frikort?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Du kan kontrollera om du har frikort genom att logga in på 1177.se 
                eller kontakta din region. När du har betalat 1 400 kronor i 
                patientavgifter under en 12-månadersperiod får du automatiskt ett 
                frikort som gäller resten av perioden.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Edit Button */}
        <Button className="w-full" variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          Redigera
        </Button>
      </div>
    </div>
  );
}
