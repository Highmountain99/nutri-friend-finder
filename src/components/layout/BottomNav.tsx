import { Home, BookOpen, MessageCircle, UtensilsCrossed, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUnreadPatientMessages } from "@/hooks/useUnreadPatientMessages";
import { useSuggestedRecipes } from "@/hooks/useSuggestedRecipes";

const navItems = [
  { path: "/home", icon: Home, label: "Hem", tour: undefined as string | undefined },
  { path: "/journal", icon: BookOpen, label: "Journal", tour: "journal" },
  { path: "/messages", icon: MessageCircle, label: "Chatt", tour: undefined },
  { path: "/recipes", icon: UtensilsCrossed, label: "Recept", tour: "recipes" },
  { path: "/progress", icon: TrendingUp, label: "Resan", tour: "progress" },
];

export function BottomNav() {
  const unreadCount = useUnreadPatientMessages();
  const { active: suggestedRecipes } = useSuggestedRecipes();
  const suggestedCount = suggestedRecipes.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))] px-4">
      <div className="pointer-events-auto max-w-lg mx-auto rounded-pill bg-primary px-2 py-2 shadow-[0_10px_30px_-12px_rgba(20,35,25,0.65)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-tour={item.tour}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-pill transition-all duration-200 min-w-[58px]"
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "relative rounded-pill p-1.5 transition-all duration-200",
                      isActive ? "bg-primary-foreground/15" : ""
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5",
                        isActive ? "text-primary-foreground" : "text-primary-foreground/60"
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    {item.path === "/messages" && unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-pill bg-terracotta text-primary text-[10px] font-bold leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {item.path === "/recipes" && suggestedCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-pill bg-terracotta text-primary text-[10px] font-bold leading-none">
                        {suggestedCount > 9 ? "9+" : suggestedCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      isActive ? "text-primary-foreground" : "text-primary-foreground/60"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
