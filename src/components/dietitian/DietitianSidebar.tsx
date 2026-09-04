import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ChevronsUpDown,
  UtensilsCrossed,
  ChevronDown,
  User,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDietitianProfile } from "@/hooks/dietitian/useDietitianProfile";
import { useUnreadMessages } from "@/hooks/dietitian/useUnreadMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { title: "Översikt", url: "/dietitian", icon: LayoutDashboard, end: true },
  { title: "Klienter", url: "/dietitian/patients", icon: Users },
  { title: "Meddelanden", url: "/dietitian/messages", icon: MessageSquare, badgeKey: "messages" },
  { title: "Recept", url: "/dietitian/recipes", icon: UtensilsCrossed },
];

export function DietitianSidebar() {
  const { signOut, user } = useAuth();
  const { data: profile } = useDietitianProfile();
  const { data: unread } = useUnreadMessages();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const { data: isAdmin } = useQuery({
    queryKey: ["user-role-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin" as const,
      });
      return !!data;
    },
    enabled: !!user,
  });

  const settingsOpen = location.pathname.startsWith("/dietitian/profile") || location.pathname.startsWith("/dietitian/admin");

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`
    : "D";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {!collapsed ? (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide text-sidebar-foreground uppercase">
              Gut Feeling
            </span>
            <span className="text-[10px] font-medium tracking-wider text-sidebar-foreground/50 uppercase">
              EatSuite
            </span>
          </div>
        ) : (
          <span className="text-xs font-bold text-sidebar-foreground">GF</span>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-3 rounded-pill px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                    >
                      <div className="relative shrink-0">
                        <item.icon className="h-4 w-4" />
                        {item.badgeKey === "messages" && (unread?.total ?? 0) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-pill bg-terracotta text-primary text-[10px] font-bold px-1">
                            {unread!.total > 99 ? "99+" : unread!.total}
                          </span>
                        )}
                      </div>
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>

                  {item.url === "/dietitian/patients" && (
                    <div className={collapsed ? "" : "ml-4 border-l border-sidebar-border pl-3 mt-1 space-y-0.5"}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to="/dietitian/groups"
                          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                        >
                          <Users2 className="h-3.5 w-3.5 shrink-0" />
                          {!collapsed && <span>Träningsgrupper</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </div>
                  )}
                </SidebarMenuItem>
              ))}

              {/* Collapsible Settings */}
              <SidebarMenuItem>
                <Collapsible defaultOpen={settingsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground w-full ${settingsOpen ? "text-sidebar-primary font-medium" : "text-sidebar-foreground/70"}`}>
                      <Settings className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">Inställningar</span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 border-l border-sidebar-border pl-3 mt-1 space-y-0.5">
                      <SidebarMenuButton asChild>
                        <NavLink
                          to="/dietitian/profile"
                          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                        >
                          <User className="h-3.5 w-3.5 shrink-0" />
                          {!collapsed && <span>Profil</span>}
                        </NavLink>
                      </SidebarMenuButton>
                      {isAdmin && (
                        <SidebarMenuButton asChild>
                          <NavLink
                            to="/dietitian/admin"
                            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            {!collapsed && <span>Administration</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile ? `${profile.first_name} ${profile.last_name}` : "Coach"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {profile?.title ?? "Coach"}
                  </p>
                </div>
              )}
              {!collapsed && <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/40" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logga ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
