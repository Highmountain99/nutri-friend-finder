import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { SideMenu } from "./SideMenu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);

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

    // Listen for profile changes to keep name in sync
    const channel = supabase
      .channel('profile-name')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        if (payload.new?.first_name) setProfileName(payload.new.first_name);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const userName = profileName ||
                   user?.user_metadata?.first_name || 
                   user?.user_metadata?.full_name || 
                   user?.email?.split("@")[0] || 
                   "Användare";

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <main className="pb-20 max-w-lg mx-auto">
        <Outlet />
      </main>
      
      <BottomNav />
    </div>
  );
}
