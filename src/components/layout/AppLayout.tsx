import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { SideMenu } from "./SideMenu";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  
  // Extract display name from user email or metadata
  const userName = user?.user_metadata?.full_name || 
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
