import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetPeriodProvider } from './context/BudgetPeriodContext';
import AppLayout from './components/layout/AppLayout';
import { PageLoader } from './components/ui/LoadingSpinner';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPeriodsPage from './pages/BudgetPeriodsPage';
import IncomePage from './pages/IncomePage';
import BillsPage from './pages/BillsPage';
import ExpensesPage from './pages/ExpensesPage';
import DebtPage from './pages/DebtPage';
import SavingsPage from './pages/SavingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  // Apply saved theme on initial render
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (!theme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <BudgetPeriodProvider>
              <AppLayout />
            </BudgetPeriodProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="budget-periods" element={<BudgetPeriodsPage />} />
        <Route path="income" element={<IncomePage />} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="debt" element={<DebtPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
