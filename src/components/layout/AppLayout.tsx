import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { SideMenu } from "./SideMenu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AppTutorial } from "@/components/tutorial/AppTutorial";

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);
  usePushNotifications();

  useEffect(() => {
    if (!user) return;
    
    const fetchName = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.first_name) setProfileName(data.first_name);
    };
    fetchName();

    // Listen for profile-updated events from settings
    const handler = () => fetchName();
    window.addEventListener("profile-updated", handler);

    return () => { window.removeEventListener("profile-updated", handler); };
  }, [user]);

  const userName = profileName ||
                   user?.user_metadata?.first_name || 
                   user?.user_metadata?.full_name || 
                   user?.email?.split("@")[0] || 
                   "Användare";

  return (
    <div className="min-h-dvh bg-background">
      <button
        aria-label="Öppna meny"
        onClick={() => setIsMenuOpen(true)}
        className="fixed left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <Menu className="h-5 w-5" />
      </button>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto">
        <Outlet />
      </main>

      
      <BottomNav />
      <AppTutorial />
    </div>
  );
}
