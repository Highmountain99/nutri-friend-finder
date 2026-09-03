import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Info } from "lucide-react";

interface EditGoalsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: string[];
}

export function EditGoalsSheet({
  open,
  onOpenChange,
  goals,
}: EditGoalsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Dina mål</SheetTitle>
          <SheetDescription>
            Målen du vill uppnå med din kostplanering
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {goals.length > 0 ? (
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground">{goal}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Inga mål registrerade ännu
            </p>
          )}
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Dina mål sattes under registreringen. Kontakta din coach 
              om du vill uppdatera dina hälsomål.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
