import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrainingDay {
  id: string;
  patient_id: string;
  weekday: number; // 0 = söndag ... 6 = lördag
  start_time: string | null;
  label: string | null;
  session_date: string | null; // satt för enstaka pass
}

export const WEEKDAY_LABELS = ["Sön", "Mån", "Tis", "Ons", "Tors", "Fre", "Lör"];
export const WEEKDAY_LONG = [
  "söndag",
  "måndag",
  "tisdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lördag",
];

/** Klientens egna passdagar */
export function useMyTrainingDays() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["training-days", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_training_days")
        .select("id, patient_id, weekday, start_time, label, session_date")
        .eq("patient_id", user!.id)
        .order("weekday", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TrainingDay[];
    },
    enabled: !!user,
  });
}

/** Coachens vy/redigering av en klients passdagar */
export function useClientTrainingDays(patientId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["training-days", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_training_days")
        .select("id, patient_id, weekday, start_time, label, session_date")
        .eq("patient_id", patientId!)
        .order("weekday", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TrainingDay[];
    },
    enabled: !!patientId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["training-days", patientId] });

  const addDay = useMutation({
    mutationFn: async ({
      weekday,
      startTime,
      sessionDate,
    }: {
      weekday: number;
      startTime?: string | null;
      sessionDate?: string | null;
    }) => {
      const { error } = await supabase.from("client_training_days").insert({
        patient_id: patientId!,
        dietitian_id: user!.id,
        weekday,
        start_time: startTime || null,
        session_date: sessionDate || null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTime = useMutation({
    mutationFn: async ({ id, startTime }: { id: string; startTime: string | null }) => {
      const { error } = await supabase
        .from("client_training_days")
        .update({ start_time: startTime || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeDay = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_training_days").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, addDay, updateTime, removeDay };
}

/** Räknar ut nästa pass utifrån veckodagar + tid */
export function getNextSession(days: TrainingDay[], now = new Date()) {
  if (!days.length) return null;
  let best: { date: Date; day: TrainingDay } | null = null;

  for (const day of days) {
    const [h, m] = (day.start_time || "00:00").split(":").map(Number);
    if (day.session_date) {
      const [y, mo, dd] = day.session_date.split("-").map(Number);
      const d = new Date(y, (mo || 1) - 1, dd || 1, h || 0, m || 0, 0, 0);
      if (d.getTime() >= now.getTime() && (!best || d.getTime() < best.date.getTime())) {
        best = { date: d, day };
      }
      continue;
    }
    for (let offset = 0; offset < 8; offset++) {
      const d = new Date(now);
      d.setDate(now.getDate() + offset);
      if (d.getDay() !== day.weekday) continue;
      d.setHours(h || 0, m || 0, 0, 0);
      if (d.getTime() < now.getTime()) continue;
      if (!best || d.getTime() < best.date.getTime()) best = { date: d, day };
      break;
    }
  }
  return best;
}
