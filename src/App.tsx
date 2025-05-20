
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Header } from "./components/Header";
import { useAuth } from "./components/AuthProvider";

// Pages
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AttributesPage from "./pages/AttributesPage";
import TeamsPage from "./pages/TeamsPage";
import FinancePage from "./pages/FinancePage";
import ScoreboardPage from "./pages/ScoreboardPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-volleyball-cyan"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Auth check component that redirects logged in users away from login page
const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-volleyball-cyan"></div>
    </div>;
  }
  
  if (user) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <AuthCheck>
            <LoginPage />
          </AuthCheck>
        } 
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Header />
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/atributos"
        element={
          <ProtectedRoute>
            <Header />
            <AttributesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/times"
        element={
          <ProtectedRoute>
            <Header />
            <TeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contabilidade"
        element={
          <ProtectedRoute>
            <Header />
            <FinancePage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/placar" 
        element={<ScoreboardPage />} 
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Header />
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen">
              <AppRoutes />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
