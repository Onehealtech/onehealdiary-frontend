import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminDiaryInventory from "./pages/SuperAdminDiaryInventory";
import VendorDashboard from "./pages/VendorDashboard";
import VendorMyDiaries from "./pages/VendorMyDiaries";
import DoctorDashboard from "./pages/DoctorDashboard";
import AssistantDashboard from "./pages/AssistantDashboard";
import NotFound from "./pages/NotFound";
import VerifyOtpPage from "./components/common/VerifyOtpPage";

const queryClient = new QueryClient();

function ProtectedRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/verify-otp" element={<VerifyOtpPage />} />
    <Route path="/super-admin" element={<ProtectedRoute role="SUPER_ADMIN"><SuperAdminDashboard /></ProtectedRoute>} />
    <Route path="/super-admin/diary-inventory" element={<ProtectedRoute role="SUPER_ADMIN"><SuperAdminDiaryInventory /></ProtectedRoute>} />
    <Route path="/super-admin/*" element={<ProtectedRoute role="SUPER_ADMIN"><SuperAdminDashboard /></ProtectedRoute>} />
    <Route path="/vendor" element={<ProtectedRoute role="VENDOR"><VendorDashboard /></ProtectedRoute>} />
    <Route path="/vendor/my-diaries" element={<ProtectedRoute role="VENDOR"><VendorMyDiaries /></ProtectedRoute>} />
    <Route path="/vendor/*" element={<ProtectedRoute role="VENDOR"><VendorDashboard /></ProtectedRoute>} />
    <Route path="/doctor" element={<ProtectedRoute role="DOCTOR"><DoctorDashboard /></ProtectedRoute>} />
    <Route path="/doctor/*" element={<ProtectedRoute role="DOCTOR"><DoctorDashboard /></ProtectedRoute>} />
    <Route path="/assistant" element={<ProtectedRoute role="ASSISTANT"><AssistantDashboard /></ProtectedRoute>} />
    <Route path="/assistant/*" element={<ProtectedRoute role="ASSISTANT"><AssistantDashboard /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
