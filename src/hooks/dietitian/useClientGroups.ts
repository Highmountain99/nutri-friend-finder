import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientGroup {
  id: string;
  name: string;
  created_at: string;
  member_ids: string[];
}

export function useClientGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-groups", user?.id],
    queryFn: async (): Promise<ClientGroup[]> => {
      const { data: groups, error } = await supabase
        .from("client_groups")
        .select("id, name, created_at")
        .eq("dietitian_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!groups?.length) return [];

      const { data: members, error: memberError } = await supabase
        .from("client_group_members")
        .select("group_id, patient_id")
        .in(
          "group_id",
          groups.map((g) => g.id),
        );
      if (memberError) throw memberError;

      return groups.map((g) => ({
        ...g,
        member_ids: (members ?? []).filter((m) => m.group_id === g.id).map((m) => m.patient_id),
      }));
    },
    enabled: !!user,
  });
}

export function useClientGroupMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["client-groups", user?.id] });

  const createGroup = useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
      const { data, error } = await supabase
        .from("client_groups")
        .insert({ dietitian_id: user!.id, name })
        .select("id")
        .single();
      if (error) throw error;
      if (memberIds.length) {
        const { error: memberError } = await supabase
          .from("client_group_members")
          .insert(memberIds.map((patient_id) => ({ group_id: data.id, patient_id })));
        if (memberError) throw memberError;
      }
      return data.id;
    },
    onSuccess: invalidate,
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, name, memberIds }: { id: string; name: string; memberIds: string[] }) => {
      const { error } = await supabase.from("client_groups").update({ name }).eq("id", id);
      if (error) throw error;

      const { data: existing, error: readError } = await supabase
        .from("client_group_members")
        .select("patient_id")
        .eq("group_id", id);
      if (readError) throw readError;

      const current = (existing ?? []).map((m) => m.patient_id);
      const toAdd = memberIds.filter((m) => !current.includes(m));
      const toRemove = current.filter((m) => !memberIds.includes(m));

      if (toAdd.length) {
        const { error: addError } = await supabase
          .from("client_group_members")
          .insert(toAdd.map((patient_id) => ({ group_id: id, patient_id })));
        if (addError) throw addError;
      }
      if (toRemove.length) {
        const { error: removeError } = await supabase
          .from("client_group_members")
          .delete()
          .eq("group_id", id)
          .in("patient_id", toRemove);
        if (removeError) throw removeError;
      }
    },
    onSuccess: invalidate,
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createGroup, updateGroup, deleteGroup };
}
