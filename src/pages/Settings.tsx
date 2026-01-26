import { ArrowLeft, User, Bell, Shield, CreditCard, HelpCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const settingsSections = [
  {
    title: "Konto",
    items: [
      { icon: User, label: "Personuppgifter", action: "navigate" },
      { icon: Bell, label: "Notifikationer", action: "toggle", enabled: true },
      { icon: Shield, label: "Sekretess & Säkerhet", action: "navigate" },
    ],
  },
  {
    title: "Betalning",
    items: [
      { icon: CreditCard, label: "Betalningsmetoder", action: "navigate" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Hjälp & Vanliga frågor", action: "navigate" },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Inställningar</h1>
          <p className="text-sm text-muted-foreground">Hantera ditt konto</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="shadow-soft">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xl font-bold">
            EM
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Erik Magnusson</h3>
            <p className="text-sm text-muted-foreground">erik.magnusson@email.se</p>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <section key={section.title}>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {section.title}
          </h2>
          <Card className="shadow-soft">
            <CardContent className="p-0 divide-y divide-border">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  {item.action === "toggle" ? (
                    <Switch checked={item.enabled} />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ))}

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground">
        EatSuite version 1.0.0
      </p>
    </div>
  );
}
