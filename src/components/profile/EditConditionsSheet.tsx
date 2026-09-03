import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface EditConditionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conditions: string[];
}

export function EditConditionsSheet({
  open,
  onOpenChange,
  conditions,
}: EditConditionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Diagnoser & tillstånd</SheetTitle>
          <SheetDescription>
            Dina registrerade hälsotillstånd
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition) => (
                <Badge key={condition} variant="secondary" className="px-3 py-1">
                  {condition}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Inga diagnoser eller tillstånd registrerade
            </p>
          )}
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Diagnoser sätts i samråd med din coach och kan inte ändras här. 
              Kontakta din coach om något behöver uppdateras.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
