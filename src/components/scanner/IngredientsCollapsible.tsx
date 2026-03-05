import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface IngredientsCollapsibleProps {
  textSv?: string;
  text?: string;
}

export function IngredientsCollapsible({ textSv, text }: IngredientsCollapsibleProps) {
  const [open, setOpen] = useState(false);
  const content = textSv || text;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
        <span className="text-sm font-semibold text-foreground">Ingredienser</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-sm text-muted-foreground leading-relaxed pb-2">
          {content || "Ingredienslista ej tillgänglig"}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
