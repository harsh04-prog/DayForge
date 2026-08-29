import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { HabitsPage } from './pages/HabitsPage';
import { HabitDetailPage } from './pages/HabitDetailPage';
import { ProgressPage } from './pages/ProgressPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { WeeklyReviewPage } from './pages/WeeklyReviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './context/AuthContext';
import { InstallGuideModal } from './components/pwa/InstallGuideModal';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { PWAUpdateToast } from './components/pwa/PWAUpdateToast';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

// Public Route Guard (Redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <>
      {/* Global Offline Status */}
      <OfflineIndicator />

      {/* Global PWA Update Toast */}
      <PWAUpdateToast />

      <Routes>
        {/* Public Pages */}
        <Route
          path="/welcome"
          element={
            <PublicRoute>
              <WelcomePage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Authenticated Application Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/weekly-review" element={<WeeklyReviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global PWA Install Banner & Install Guide Modal */}
      <PWAInstallBanner />
      <InstallGuideModal />
    </>
  );
};
