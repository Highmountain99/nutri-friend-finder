import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface DietitianInfo {
  firstName: string;
  lastName: string;
  title: string;
  avatarUrl: string | null;
}

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dietitian, setDietitian] = useState<DietitianInfo | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);

  useEffect(() => {
    const completeBooking = async () => {
      if (!user) {
        setStatus('error');
        setErrorMessage('Du måste vara inloggad för att slutföra bokningen.');
        return;
      }

      const sessionId = searchParams.get('session_id');
      const dietitianId = searchParams.get('dietitian_id');
      const appointmentDateStr = searchParams.get('appointment_date');
      const appointmentType = searchParams.get('appointment_type') || 'video';

      if (!sessionId || !dietitianId || !appointmentDateStr) {
        setStatus('error');
        setErrorMessage('Saknar bokningsinformation. Var vänlig försök igen.');
        return;
      }

      try {
        // Parse appointment date
        const parsedDate = new Date(decodeURIComponent(appointmentDateStr));
        setAppointmentDate(parsedDate);

        // Fetch dietitian info
        const { data: dietitianData, error: dietitianError } = await supabase
          .from('dietitian_profiles')
          .select('first_name, last_name, title, avatar_url')
          .eq('id', dietitianId)
          .single();

        if (dietitianError) throw dietitianError;

        setDietitian({
          firstName: dietitianData.first_name,
          lastName: dietitianData.last_name,
          title: dietitianData.title,
          avatarUrl: dietitianData.avatar_url,
        });

        // Cancel any existing upcoming booked appointments
        const nowIso = new Date().toISOString();
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('user_id', user.id)
          .eq('status', 'booked')
          .gte('appointment_date', nowIso);

        // Create the appointment with Stripe session info
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            user_id: user.id,
            dietitian_id: dietitianId,
            appointment_date: parsedDate.toISOString(),
            appointment_type: appointmentType,
            status: 'booked',
            stripe_setup_intent_id: sessionId,
            payment_method_saved: true,
          });

        if (appointmentError) throw appointmentError;

        setStatus('success');
      } catch (error) {
        console.error('Error completing booking:', error);
        setStatus('error');
        setErrorMessage('Något gick fel när bokningen skulle slutföras. Var vänlig kontakta oss.');
      }
    };

    completeBooking();
  }, [user, searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-semibold">Slutför bokning...</h2>
            <p className="text-muted-foreground">Vänligen vänta medan vi bekräftar din bokning.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Något gick fel</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button onClick={handleGoHome} className="w-full">
              Gå till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Tid bokad!</h2>
            <p className="text-muted-foreground">
              Din bokning är bekräftad och dina kortuppgifter har sparats.
            </p>
          </div>

          {dietitian && appointmentDate && (
            <div className="bg-muted rounded-xl p-4 text-left space-y-2">
              <p className="font-medium">
                {dietitian.firstName} {dietitian.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{dietitian.title}</p>
              <p className="text-sm">
                {format(appointmentDate, "EEEE d MMMM 'kl.' HH:mm", { locale: sv })}
              </p>
            </div>
          )}

          <div className="bg-accent/50 rounded-xl p-4 text-left">
            <p className="text-sm text-accent-foreground">
              <strong>Observera:</strong> Om du uteblir utan att avboka minst 24 timmar i förväg debiteras en no-show-avgift på 275 kr.
            </p>
          </div>

          <Button onClick={handleGoHome} size="lg" className="w-full">
            Gå till startsidan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
