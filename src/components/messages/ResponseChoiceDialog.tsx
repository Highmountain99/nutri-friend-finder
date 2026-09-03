import { Bot, UserRound } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ResponseChoiceDialogProps {
  open: boolean;
  onChoice: (choice: "ai" | "wait") => void;
  dietitianName?: string;
}

export function ResponseChoiceDialog({
  open,
  onChoice,
  dietitianName,
}: ResponseChoiceDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[340px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-base">
            Hur vill du få svar?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm">
            Välj om du vill ha ett direkt svar eller vänta på{" "}
            {dietitianName || "din dietist"}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            variant="default"
            className="w-full gap-3 h-auto py-3 justify-start"
            onClick={() => onChoice("ai")}
          >
            <Bot className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-sm">Svar direkt</p>
              <p className="text-xs opacity-80 font-normal">
                AI-assistent tränad på {dietitianName ? `${dietitianName}s` : "coachens"} kunskap
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full gap-3 h-auto py-3 justify-start"
            onClick={() => onChoice("wait")}
          >
            <UserRound className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-sm">Vänta på {dietitianName || "coachen"}</p>
              <p className="text-xs text-muted-foreground font-normal">
                Personligt svar, kan ta lite längre tid
              </p>
            </div>
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
