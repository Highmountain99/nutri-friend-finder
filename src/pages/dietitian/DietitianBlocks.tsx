import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, Blocks } from "lucide-react";
import { useBlockTemplates, useDeleteBlockTemplate, BlockTemplate } from "@/hooks/dietitian/useBlockTemplates";
import { BlockCard, CATEGORY_LABELS, BLOCK_TYPE_LABELS, DATA_SOURCE_LABELS } from "@/components/dietitian/blocks/BlockCard";
import { BlockBuilderSheet } from "@/components/dietitian/blocks/BlockBuilderSheet";

export default function DietitianBlocks() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<BlockTemplate | null>(null);

  const { data: templates, isLoading } = useBlockTemplates({
    category: categoryFilter,
    block_type: typeFilter,
    data_source: sourceFilter,
  });
  const deleteMutation = useDeleteBlockTemplate();

  const filtered = (templates || []).filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Blocks className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Blockbibliotek</h1>
            <p className="text-sm text-muted-foreground">Skapa och hantera behandlingsblock med datakoppling</p>
          </div>
        </div>
        <Button onClick={() => { setEditTemplate(null); setBuilderOpen(true); }} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Skapa block
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök block..." className="pl-9 rounded-xl" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Område" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla områden</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 rounded-xl"><SelectValue placeholder="Typ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla typer</SelectItem>
            {Object.entries(BLOCK_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Datakälla" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla datakällor</SelectItem>
            {Object.entries(DATA_SOURCE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Blocks className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Inga block hittades</p>
          <p className="text-sm text-muted-foreground mt-1">Skapa ditt första block för att komma igång.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <BlockCard
              key={template.id}
              template={template}
              onEdit={() => { setEditTemplate(template); setBuilderOpen(true); }}
              onDelete={() => deleteMutation.mutate(template.id)}
            />
          ))}
        </div>
      )}

      <BlockBuilderSheet
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        editTemplate={editTemplate}
      />
    </div>
  );
}
