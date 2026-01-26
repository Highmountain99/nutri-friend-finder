import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { SideMenu } from "./SideMenu";

interface AppLayoutProps {
  userName?: string;
}

export function AppLayout({ userName }: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
