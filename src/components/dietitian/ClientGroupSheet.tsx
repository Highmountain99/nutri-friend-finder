import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { useClientGroupMutations, type ClientGroup } from "@/hooks/dietitian/useClientGroups";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ClientGroup | null;
}

export function ClientGroupSheet({ open, onOpenChange, group }: Props) {
  const { data: patients } = useAssignedPatients();
  const { createGroup, updateGroup } = useClientGroupMutations();
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setName(group?.name ?? "");
      setMemberIds(group?.member_ids ?? []);
      setSearch("");
    }
  }, [open, group]);

  const filtered = (patients ?? []).filter((p) =>
    getPatientDisplayName(p).toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) =>
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const saving = createGroup.isPending || updateGroup.isPending;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Ge gruppen ett namn");
      return;
    }
    try {
      if (group) {
        await updateGroup.mutateAsync({ id: group.id, name: name.trim(), memberIds });
      } else {
        await createGroup.mutateAsync({ name: name.trim(), memberIds });
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Kunde inte spara gruppen");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{group ? "Redigera träningsgrupp" : "Ny träningsgrupp"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0 mt-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Gruppnamn</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Måndagsgruppen"
            />
          </div>

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label>Klienter ({memberIds.length} valda)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök klient..."
                className="pl-9"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 -mx-1 px-1">
              {filtered.map((p) => (
                <label
                  key={p.patient_id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors"
                >
                  <Checkbox
                    checked={memberIds.includes(p.patient_id)}
                    onCheckedChange={() => toggle(p.patient_id)}
                  />
                  <span className="text-sm">{getPatientDisplayName(p)}</span>
                </label>
              ))}
              {!filtered.length && (
                <p className="text-sm text-muted-foreground text-center py-6">Inga klienter hittades</p>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : group ? "Spara ändringar" : "Skapa grupp"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
