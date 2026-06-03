import { Home, BookOpen, MessageCircle, UtensilsCrossed, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUnreadPatientMessages } from "@/hooks/useUnreadPatientMessages";
import { useSuggestedRecipes } from "@/hooks/useSuggestedRecipes";

const navItems = [
  { path: "/home", icon: Home, label: "Hem" },
  { path: "/journal", icon: BookOpen, label: "Journal" },
  { path: "/messages", icon: MessageCircle, label: "Meddelanden" },
  { path: "/recipes", icon: UtensilsCrossed, label: "Recept" },
  { path: "/progress", icon: TrendingUp, label: "Utveckling" },
];

export function BottomNav() {
  const unreadCount = useUnreadPatientMessages();
  const { active: suggestedRecipes } = useSuggestedRecipes();
  const suggestedCount = suggestedRecipes.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "relative p-1.5 rounded-lg transition-all duration-200",
                    isActive && "bg-primary-soft"
                  )}
                >
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.path === "/messages" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
