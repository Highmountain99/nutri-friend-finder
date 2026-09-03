import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home as HomeIcon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DevTools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dev Tools</h1>
          <p className="text-sm text-muted-foreground">Snabb navigering i appen</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HomeIcon className="w-5 h-5 text-primary" />
            Snabbnavigation
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => navigate("/home")}>Klient-hem</Button>
          <Button variant="outline" onClick={() => navigate("/messages")}>Meddelanden</Button>
          <Button variant="outline" onClick={() => navigate("/dietitian")}>Coach-dashboard</Button>
          <Button variant="outline" onClick={() => navigate("/dietitian/messages")}>Coach-chatt</Button>
          <Button variant="outline" onClick={() => navigate("/dietitian/patients")}>Klienter</Button>
          <Button variant="outline" onClick={() => navigate("/admin")}>Admin</Button>
        </CardContent>
      </Card>
    </div>
  );
}
