import { useState } from 'react';
import { openExternal } from "@/lib/openExternal";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeSlot } from '@/types/dietitian';

interface BookingCheckoutParams {
  dietitianId: string;
  dietitianName: string;
  appointmentDate: Date;
  appointmentType?: 'video' | 'phone' | 'in_person';
}

export function useBookingCheckout() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const initiateCheckout = async ({
    dietitianId,
    dietitianName,
    appointmentDate,
    appointmentType = 'video',
  }: BookingCheckoutParams): Promise<boolean> => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body: {
          dietitian_id: dietitianId,
          dietitian_name: dietitianName,
          appointment_date: appointmentDate.toISOString(),
          appointment_type: appointmentType,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        await openExternal(data.url);
        return true;
      } else {
        throw new Error('Ingen checkout-URL mottogs');
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte starta betalningsflödet. Försök igen.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutFromSlot = async (
    dietitianId: string,
    dietitianName: string,
    date: Date,
    slot: TimeSlot,
    appointmentType: 'video' | 'phone' | 'in_person' = 'video'
  ): Promise<boolean> => {
    const appointmentDate = new Date(date);
    appointmentDate.setHours(slot.hour, slot.minute, 0, 0);

    return initiateCheckout({
      dietitianId,
      dietitianName,
      appointmentDate,
      appointmentType,
    });
  };

  return {
    initiateCheckout,
    createCheckoutFromSlot,
    loading,
  };
}
