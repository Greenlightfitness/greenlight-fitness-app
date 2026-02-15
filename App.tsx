import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AcceptInvite from './pages/AcceptInvite';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Planner from './pages/Planner';
import AdminProducts from './pages/AdminProducts';
import AdminUsers from './pages/AdminUsers';
import AdminAthleteAssignment from './pages/AdminAthleteAssignment';
import AdminCRM from './pages/AdminCRM';
import CoachCalendarSetup from './pages/CoachCalendarSetup';
import CoachChatPage from './pages/CoachChatPage';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import WorkoutHistory from './pages/WorkoutHistory';
import Legal from './pages/Legal';
import PublicBooking from './pages/PublicBooking';
import ApiDocs from './pages/ApiDocs';
import PurchaseConfirmation from './pages/PurchaseConfirmation';
import CoachingIntake from './pages/CoachingIntake';
import CoachingDossier from './pages/CoachingDossier';
import IntakeForms from './pages/IntakeForms';
import IntakeFormFill from './pages/IntakeFormFill';
import Layout from './components/Layout';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import CoachOnboarding from './components/CoachOnboarding';
import AdminOnboarding from './components/AdminOnboarding';
import ProfileSetupWizard from './components/ProfileSetupWizard';
import { UserRole } from './types';

// Protected Route Wrapper with Onboarding Gate
const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const { user, userProfile, loading, refreshProfile, activeRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#00FF00]">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Onboarding Gate — show role-specific onboarding if not completed
  if (userProfile && !userProfile.onboardingCompleted) {
    const effectiveRole = activeRole || userProfile.role;
    if (effectiveRole === UserRole.COACH) {
      return <CoachOnboarding onComplete={() => refreshProfile()} />;
    }
    if (effectiveRole === UserRole.ADMIN) {
      return <AdminOnboarding onComplete={() => refreshProfile()} />;
    }
    // Athlete fallback — existing wizard
    return <ProfileSetupWizard onComplete={() => refreshProfile()} />;
  }

  // Strict Role Check
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    if (userProfile.role === UserRole.ATHLETE) {
        return <Navigate to="/" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <PWAInstallPrompt />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/invite/:code" element={<AcceptInvite />} />
            
            {/* Public Booking Page (no auth required) */}
            <Route path="/book/:slug" element={<PublicBooking />} />
            
            {/* API Documentation (no auth, noindex) */}
            <Route path="/api-docs" element={<ApiDocs />} />

            {/* Legal Pages (Public) */}
            <Route path="/legal/imprint" element={<Legal />} />
            <Route path="/legal/privacy" element={<Legal />} />
            <Route path="/legal/terms" element={<Legal />} />
            <Route path="/legal/transparency" element={<Legal />} />
            
            <Route element={<Layout />}>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
              </Route>
              
              {/* Profile: accessible by ALL roles */}
              <Route element={<ProtectedRoute />}>
                 <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Athlete Accessible Routes */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.ATHLETE]} />}>
                 <Route path="/shop" element={<Shop />} />
                 <Route path="/chat" element={<Chat />} />
                 <Route path="/history" element={<WorkoutHistory />} />
                 <Route path="/purchase-confirmation" element={<PurchaseConfirmation />} />
                 <Route path="/coaching-intake" element={<CoachingIntake />} />
                 <Route path="/intake-form-fill" element={<IntakeFormFill />} />
              </Route>
              
              {/* Shared Routes (Coach, Admin AND Athlete now for self-planning) */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN, UserRole.ATHLETE]} />}>
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/planner" element={<Planner />} />
              </Route>

              {/* Coach & Admin: Calendar, Chat, Products (read-only for Coach), CRM, Dossier */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]} />}>
                <Route path="/calendar" element={<CoachCalendarSetup />} />
                <Route path="/coach/chat" element={<CoachChatPage />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/intake-forms" element={<IntakeForms />} />
                <Route path="/admin/crm" element={<AdminCRM />} />
                <Route path="/coaching/:athleteId" element={<CoachingDossier />} />
              </Route>

              {/* Admin Only (User Management) */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>
            </Route>

            {/* Redirect /settings to /profile#notifications (for email links) */}
            <Route path="/settings" element={<Navigate to="/profile#notifications" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;