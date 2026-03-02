import { Outlet } from "react-router-dom";
import { DietitianSidebar } from "./DietitianSidebar";

export function DietitianLayout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <DietitianSidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
