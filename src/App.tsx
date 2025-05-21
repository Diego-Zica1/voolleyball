
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Header } from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/LoginPage'; // Using LoginPage as a fallback since RegisterPage doesn't exist
import TeamsPage from './pages/TeamsPage';
import AttributesPage from './pages/AttributesPage';
import FinancePage from './pages/FinancePage';
import AdminPage from './pages/AdminPage';
import ScoreboardPage from './pages/ScoreboardPage';

const App = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  // Add a router guard for the AttributesPage that only allows admins
  const AttributesPageGuard = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (!user.isAdmin) {
      return <Navigate to="/" replace />;
    }
    return <AttributesPage />;
  };

  return (
    <ThemeProvider
      defaultTheme={{
        mode: "light",
        colorScheme: "purple"
      }}
      storageKey="volleyball-ui-theme"
    >
      <div className="flex flex-col min-h-screen">
        <Router>
          <AuthProvider>
            <Header />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/attributes" element={<AttributesPageGuard />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/scoreboard" element={<ScoreboardPage />} />
              </Routes>
            </div>
          </AuthProvider>
        </Router>
        <Toaster />
      </div>
    </ThemeProvider>
  );
};

export default App;
