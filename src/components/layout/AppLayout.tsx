import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AppTutorial } from "@/components/tutorial/AppTutorial";

export function AppLayout() {
  usePushNotifications();

  return (
    <div className="min-h-dvh bg-background">
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto">
        <Outlet />
      </main>

      <BottomNav />
      <AppTutorial />
    </div>
  );
}
