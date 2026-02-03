import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { QualifyingRoute } from "@/components/auth/QualifyingRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Journal from "./pages/Journal";
import Messages from "./pages/Messages";
import Recipes from "./pages/Recipes";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Qualifying from "./pages/Qualifying";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Frikort from "./pages/Frikort";
import Koder from "./pages/Koder";
import SEBForsakring from "./pages/SEBForsakring";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes - no layout */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Qualifying flow - protected but no layout, requires incomplete profile */}
            <Route element={<ProtectedRoute />}>
              <Route element={<QualifyingRoute requireQualifying />}>
                <Route path="/qualifying" element={<Qualifying />} />
              </Route>
            </Route>
            
            {/* Protected app routes with layout - requires completed qualifying */}
            <Route element={<QualifyingRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/frikort" element={<Frikort />} />
                <Route path="/koder" element={<Koder />} />
                <Route path="/seb-forsakring" element={<SEBForsakring />} />
                <Route path="/admin" element={<Admin />} />
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
