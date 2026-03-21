import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, MessageSquare, Calendar, Home as HomeIcon, ArrowLeft } from "lucide-react";
import { VideoCallModal } from "@/components/dietitian/VideoCallModal";
import { AppointmentCard } from "@/components/home/AppointmentCard";
import { useNavigate } from "react-router-dom";
import { addMinutes } from "date-fns";

export default function DevTools() {
  const navigate = useNavigate();
  const [videoOpen, setVideoOpen] = useState(false);
  const [showMockAppointment, setShowMockAppointment] = useState(false);

  // Mock appointment happening "right now" so video button shows
  const mockAppointment = {
    id: "dev-test-appointment",
    date: addMinutes(new Date(), 5), // 5 min from now — within 10-min window
    dietitianName: "Test Dietist",
    dietitianTitle: "Legitimerad dietist",
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dev Tools</h1>
          <p className="text-sm text-muted-foreground">Testa funktioner utan riktiga bokningar</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Video Call Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5 text-primary" />
              Videosamtal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Starta ett test-videosamtal direkt utan bokning. Skapar ett Whereby-rum via edge function.
            </p>
            <Button onClick={() => setVideoOpen(true)} className="w-full gap-2">
              <Video className="w-4 h-4" />
              Starta test-videosamtal
            </Button>
          </CardContent>
        </Card>

        {/* Mock Appointment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Möteskort (mock)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Visar ett möteskort som om du har en bokning om 5 minuter — videoknappen ska synas.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowMockAppointment(!showMockAppointment)}
              className="w-full"
            >
              {showMockAppointment ? "Dölj möteskort" : "Visa möteskort"}
            </Button>
            {showMockAppointment && (
              <div className="mt-4">
                <AppointmentCard
                  appointment={mockAppointment}
                  onRebook={() => {}}
                  onCancel={() => {}}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HomeIcon className="w-5 h-5 text-primary" />
              Snabbnavigation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => navigate("/home")}>Patient-hem</Button>
            <Button variant="outline" onClick={() => navigate("/messages")}>Meddelanden</Button>
            <Button variant="outline" onClick={() => navigate("/dietitian")}>Dietist-dashboard</Button>
            <Button variant="outline" onClick={() => navigate("/dietitian/messages")}>Dietist-chatt</Button>
            <Button variant="outline" onClick={() => navigate("/dietitian/schedule")}>Schema</Button>
            <Button variant="outline" onClick={() => navigate("/admin")}>Admin</Button>
          </CardContent>
        </Card>
      </div>

      <VideoCallModal
        open={videoOpen}
        onOpenChange={setVideoOpen}
        devMode
      />
    </div>
  );
}
