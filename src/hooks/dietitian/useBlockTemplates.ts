import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SYSTEM_BLOCK_TEMPLATES } from "@/lib/systemBlockTemplates";

export interface BlockTemplate {
  id: string;
  dietitian_id: string;
  title: string;
  description: string;
  icon: string;
  block_type: string;
  category: string;
  data_source: string;
  data_config: Record<string, any>;
  display_config: Record<string, any>;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlockTemplateInput {
  title: string;
  description?: string;
  icon?: string;
  block_type: string;
  category: string;
  data_source: string;
  data_config?: Record<string, any>;
  display_config?: Record<string, any>;
  is_shared?: boolean;
}

export async function seedSystemTemplates(userId: string) {
  const { data: existing } = await supabase
    .from("block_templates" as any)
    .select("id, title, data_config")
    .eq("dietitian_id", userId);

  const systemMap = new Map(SYSTEM_BLOCK_TEMPLATES.map(t => [t.key, t]));
  const existingByKey = new Map<string, { id: string; title: string }>();
  const toDelete: string[] = [];

  for (const row of existing || []) {
    const key = (row as any).data_config?.system_key;
    // Anything not in the curated set is removed (old system blocks + duplicates)
    if (!key || !systemMap.has(key) || existingByKey.has(key)) {
      toDelete.push((row as any).id);
      continue;
    }
    existingByKey.set(key, { id: (row as any).id, title: (row as any).title });
  }

  if (toDelete.length > 0) {
    // Remove patient assignments first to avoid orphan references
    await supabase.from("patient_blocks" as any).delete().in("block_template_id", toDelete);
    await supabase.from("block_templates" as any).delete().in("id", toDelete);
  }

  // Keep existing blocks in sync with the current definitions
  for (const [key, { id }] of existingByKey) {
    const def = systemMap.get(key)!;
    await supabase
      .from("block_templates" as any)
      .update({
        title: def.title,
        description: def.description,
        icon: def.icon,
        block_type: def.block_type,
        category: def.category,
        data_source: def.data_source,
        data_config: def.data_config,
        display_config: def.display_config,
      })
      .eq("id", id);
  }

  const toSeed = SYSTEM_BLOCK_TEMPLATES.filter(t => !existingByKey.has(t.key));
  if (toSeed.length === 0) return;

  const rows = toSeed.map(t => ({
    dietitian_id: userId,
    title: t.title,
    description: t.description,
    icon: t.icon,
    block_type: t.block_type,
    category: t.category,
    data_source: t.data_source,
    data_config: t.data_config,
    display_config: t.display_config,
    is_shared: false,
  }));

  await supabase.from("block_templates" as any).insert(rows);
}


export function useBlockTemplates(filters?: { category?: string; block_type?: string; data_source?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["block-templates", user?.id, filters],
    queryFn: async () => {
      // Auto-seed system templates on first load
      await seedSystemTemplates(user!.id);

      let query = supabase
        .from("block_templates" as any)
        .select("*")
        .order("usage_count", { ascending: false });

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters?.block_type && filters.block_type !== "all") {
        query = query.eq("block_type", filters.block_type);
      }
      if (filters?.data_source && filters.data_source !== "all") {
        query = query.eq("data_source", filters.data_source);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as BlockTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateBlockTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlockTemplateInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("block_templates" as any)
        .insert({
          dietitian_id: user.id,
          title: input.title,
          description: input.description || "",
          icon: input.icon || "Square",
          block_type: input.block_type,
          category: input.category,
          data_source: input.data_source,
          data_config: input.data_config || {},
          display_config: input.display_config || {},
          is_shared: input.is_shared || false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BlockTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-templates"] });
      toast.success("Block skapat");
    },
    onError: (err: any) => toast.error("Kunde inte skapa block: " + err.message),
  });
}

export function useUpdateBlockTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<BlockTemplateInput> & { id: string }) => {
      const { error } = await supabase
        .from("block_templates" as any)
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-templates"] });
      toast.success("Block uppdaterat");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteBlockTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("block_templates" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-templates"] });
      toast.success("Block borttaget");
    },
    onError: (err: any) => toast.error(err.message),
  });
}
