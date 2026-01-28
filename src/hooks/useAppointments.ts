import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  userId: string;
  dietitianId: string | null;
  appointmentDate: Date;
  status: 'booked' | 'completed' | 'cancelled' | 'no_show';
  appointmentType: 'video' | 'phone' | 'in_person';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DbAppointment {
  id: string;
  user_id: string;
  dietitian_id: string | null;
  appointment_date: string;
  status: string;
  appointment_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbToAppointment(db: DbAppointment): Appointment {
  return {
    id: db.id,
    userId: db.user_id,
    dietitianId: db.dietitian_id,
    appointmentDate: new Date(db.appointment_date),
    status: db.status as Appointment['status'],
    appointmentType: db.appointment_type as Appointment['appointmentType'],
    notes: db.notes,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function useAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      setAppointments((data || []).map(mapDbToAppointment));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingAppointment = (): Appointment | undefined => {
    const now = new Date();
    return appointments.find(
      (apt) => apt.appointmentDate > now && apt.status === 'booked'
    );
  };

  const bookAppointment = async (
    appointmentDate: Date,
    appointmentType: Appointment['appointmentType'] = 'video',
    notes?: string
  ): Promise<Appointment | null> => {
    if (!user) return null;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          appointment_date: appointmentDate.toISOString(),
          appointment_type: appointmentType,
          notes: notes || null,
          status: 'booked',
        })
        .select()
        .single();

      if (error) throw error;

      const newAppointment = mapDbToAppointment(data);
      setAppointments((prev) => [...prev, newAppointment].sort(
        (a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()
      ));

      toast({
        title: 'Tid bokad!',
        description: 'Din bokning har bekräftats.',
      });

      return newAppointment;
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte boka tiden. Försök igen.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        )
      );

      toast({
        title: 'Tid avbokad',
        description: 'Din bokning har avbokats.',
      });

      return true;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte avboka tiden. Försök igen.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    appointments,
    loading,
    saving,
    getUpcomingAppointment,
    bookAppointment,
    cancelAppointment,
    refetch: fetchAppointments,
  };
}
