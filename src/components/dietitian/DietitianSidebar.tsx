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
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Översikt", url: "/dietitian", icon: LayoutDashboard },
  { title: "Patienter", url: "/dietitian/patients", icon: Users },
  { title: "Schema", url: "/dietitian/schedule", icon: CalendarDays },
  { title: "Recept", url: "/dietitian/recipes", icon: UtensilsCrossed },
  { title: "Meddelanden", url: "/dietitian/messages", icon: MessageSquare },
  { title: "Min profil", url: "/dietitian/profile", icon: UserCircle },
];

export function DietitianSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) =>
    path === "/dietitian"
      ? location.pathname === "/dietitian"
      : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider">
            {!collapsed && "EatSuite Pro"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dietitian"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary-soft text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logga ut</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
