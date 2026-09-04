import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { QualifyingRoute } from "@/components/auth/QualifyingRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Journal from "./pages/Journal";
import Messages from "./pages/Messages";
import Recipes from "./pages/Recipes";
import Progress from "./pages/Progress";
import WeeklyReport from "./pages/WeeklyReport";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminSetup from "./pages/AdminSetup";
import { DietitianRoute } from "@/components/dietitian/DietitianRoute";
import { DietitianLayout } from "@/components/dietitian/DietitianLayout";
import DietitianDashboard from "./pages/dietitian/DietitianDashboard";
import DietitianPatients from "./pages/dietitian/DietitianPatients";
import DietitianGroups from "./pages/dietitian/DietitianGroups";
import DietitianPatientDetail from "./pages/dietitian/DietitianPatientDetail";
import DietitianRecipes from "./pages/dietitian/DietitianRecipes";
import DietitianMessages from "./pages/dietitian/DietitianMessages";
import DietitianProfile from "./pages/dietitian/DietitianProfile";
import DietitianLogin from "./pages/dietitian/DietitianLogin";
import Invite from "./pages/Invite";
import DevTools from "./pages/DevTools";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { OfflineBanner } from "./components/layout/OfflineBanner";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <OfflineBanner />
          <InstallPrompt />

          <Routes>

            {/* Landing / Auth routes - no layout */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dietitian/login" element={<DietitianLogin />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/invite/:code" element={<Invite />} />
            <Route path="/i/:code" element={<Invite />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dev" element={<DevTools />} />
            </Route>

            {/* Protected app routes with layout */}
            <Route element={<QualifyingRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/weekly-report" element={<WeeklyReport />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Admin route - requires admin role */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
              </Route>
            </Route>
            {/* Coach dashboard routes */}
            <Route element={<DietitianRoute />}>
              <Route element={<DietitianLayout />}>
                <Route path="/dietitian" element={<DietitianDashboard />} />
                <Route path="/dietitian/patients" element={<DietitianPatients />} />
                <Route path="/dietitian/groups" element={<DietitianGroups />} />
                <Route path="/dietitian/patients/:id" element={<DietitianPatientDetail />} />
                <Route path="/dietitian/recipes" element={<DietitianRecipes />} />
                <Route path="/dietitian/messages" element={<DietitianMessages />} />
                <Route path="/dietitian/profile" element={<DietitianProfile />} />
                <Route path="/dietitian/admin" element={<Admin />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
