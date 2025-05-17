
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Header } from "./components/Header";

// Pages
import AuthPage from "./pages/AuthPage";
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
  const location = useLocation();
  
  // If we're still checking if the user is authenticated, show nothing
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-volleyball-purple"></div>
    </div>;
  }
  
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // If user is authenticated, render children
  return <>{children}</>;
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
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                
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
                  element={
                    <ProtectedRoute>
                      <ScoreboardPage />
                    </ProtectedRoute>
                  }
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
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
