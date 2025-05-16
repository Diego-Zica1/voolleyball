
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Header } from "./components/Header";

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
  // This is a placeholder for auth check
  // In a real app, you'd check if the user is authenticated
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
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
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <>
                      <Header />
                      <HomePage />
                    </>
                  }
                />
                <Route
                  path="/atributos"
                  element={
                    <>
                      <Header />
                      <AttributesPage />
                    </>
                  }
                />
                <Route
                  path="/times"
                  element={
                    <>
                      <Header />
                      <TeamsPage />
                    </>
                  }
                />
                <Route
                  path="/contabilidade"
                  element={
                    <>
                      <Header />
                      <FinancePage />
                    </>
                  }
                />
                <Route path="/placar" element={<ScoreboardPage />} />
                <Route
                  path="/admin"
                  element={
                    <>
                      <Header />
                      <AdminPage />
                    </>
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
