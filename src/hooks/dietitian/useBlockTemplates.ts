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

export function useBlockTemplates(filters?: { category?: string; block_type?: string; data_source?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["block-templates", user?.id, filters],
    queryFn: async () => {
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
