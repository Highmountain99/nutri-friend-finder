import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UtensilsCrossed,
  MessageSquare,
  UserCircle,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { title: "Översikt", url: "/dietitian", icon: LayoutDashboard },
  { title: "Patienter", url: "/dietitian/patients", icon: Users },
  { title: "Schema", url: "/dietitian/schedule", icon: CalendarDays },
  { title: "Recept", url: "/dietitian/recipes", icon: UtensilsCrossed },
  { title: "Meddelanden", url: "/dietitian/messages", icon: MessageSquare },
  { title: "Min profil", url: "/dietitian/profile", icon: UserCircle },
];

export function DietitianSidebar() {
  const { signOut } = useAuth();

  return (
    <nav className="w-60 shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6">
        <span className="text-sm font-bold tracking-wide text-foreground uppercase">
          EatSuite Pro
        </span>
      </div>

      <ul className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <li key={item.title}>
            <NavLink
              to={item.url}
              end={item.url === "/dietitian"}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="border-t border-border p-3">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Logga ut</span>
        </button>
      </div>
    </nav>
  );
}
