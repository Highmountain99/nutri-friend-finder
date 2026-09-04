import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useClientGroups, useClientGroupMutations, type ClientGroup } from "@/hooks/dietitian/useClientGroups";
import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { ClientGroupSheet } from "@/components/dietitian/ClientGroupSheet";

export default function DietitianGroups() {
  const { data: groups, isLoading } = useClientGroups();
  const { data: patients } = useAssignedPatients();
  const { deleteGroup } = useClientGroupMutations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ClientGroup | null>(null);

  const nameFor = (id: string) => {
    const p = patients?.find((x) => x.patient_id === id);
    return p ? getPatientDisplayName(p) : "Klient";
  };

  const handleDelete = async (group: ClientGroup) => {
    if (!confirm(`Ta bort gruppen "${group.name}"?`)) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      toast.success("Gruppen togs bort");
    } catch {
      toast.error("Kunde inte ta bort gruppen");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Träningsgrupper</h1>
          <p className="text-muted-foreground">{groups?.length ?? 0} grupper</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny grupp
        </Button>
      </div>

      {!groups?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Du har inga träningsgrupper ännu. Skapa en för att snabbt kunna skicka recept till flera klienter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.member_ids.length} klienter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(g);
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(g)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {g.member_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {g.member_ids.slice(0, 6).map((id) => (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {nameFor(id)}
                      </Badge>
                    ))}
                    {g.member_ids.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{g.member_ids.length - 6}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientGroupSheet open={sheetOpen} onOpenChange={setSheetOpen} group={editing} />
    </div>
  );
}
