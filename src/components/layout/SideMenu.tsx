import { X, Home, BookOpen, MessageCircle, UtensilsCrossed, TrendingUp, User, Settings, HelpCircle, LogOut, Leaf, ExternalLink, CreditCard, KeyRound, Shield, CalendarDays } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { path: "/home", icon: Home, label: "Hem" },
  { path: "/journal", icon: BookOpen, label: "Journal" },
  { path: "/messages", icon: MessageCircle, label: "Meddelanden" },
  { path: "/recipes", icon: UtensilsCrossed, label: "Recept" },
  { path: "/progress", icon: TrendingUp, label: "Utveckling" },
];

const secondaryNavItems = [
  { path: "/profile", icon: User, label: "Hälsoprofil" },
  { path: "/settings", icon: Settings, label: "Inställningar" },
  { path: "/help", icon: HelpCircle, label: "Hjälp & Support" },
];

const paymentNavItems = [
  { path: "/frikort", icon: CreditCard, label: "Frikort" },
  { path: "/koder", icon: KeyRound, label: "Koder" },
  { path: "/seb-forsakring", icon: Shield, label: "SEB försäkring" },
];

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-card shadow-elevated transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Gut Feeling</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Konto
            </p>
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <User className="w-5 h-5" />
              <span>Hälsoprofil</span>
            </NavLink>

            {/* 1177 External Link */}
            <button
              onClick={() => {
                window.open("https://m07-mg-local.idp.funktionstjanster.se/samlv2/idp/sign_in/781", "_blank");
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-foreground hover:bg-muted w-full text-left"
            >
              <ExternalLink className="w-5 h-5" />
              <span>1177 - Journal</span>
            </button>

            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <Settings className="w-5 h-5" />
              <span>Inställningar</span>
            </NavLink>

            <NavLink
              to="/help"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <HelpCircle className="w-5 h-5" />
              <span>Hjälp & Support</span>
            </NavLink>

            <NavLink
              to="/meeting-history"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <CalendarDays className="w-5 h-5" />
              <span>Möteshistorik</span>
            </NavLink>

            <div className="h-px bg-border my-4" />

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Betalningsmetod
            </p>
            {paymentNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary-soft text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Logga ut</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
