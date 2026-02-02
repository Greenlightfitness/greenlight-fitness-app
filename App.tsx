import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Planner from './pages/Planner';
import AdminProducts from './pages/AdminProducts';
import AdminUsers from './pages/AdminUsers';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Legal from './pages/Legal';
import Layout from './components/Layout';
import { UserRole } from './types';

// Protected Route Wrapper
const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const { user, userProfile, loading } = useAuth();

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

  // Strict Role Check
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    // If Athlete tries to access Coach routes that are NOT allowed, send to Hub
    // (Note: Planner and Exercises are now allowed for Athletes in the route definition below)
    if (userProfile.role === UserRole.ATHLETE) {
        return <Navigate to="/" replace />;
    }
    // General fallback
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Legal Pages (Public) */}
            <Route path="/legal/imprint" element={<Legal />} />
            <Route path="/legal/privacy" element={<Legal />} />
            <Route path="/legal/terms" element={<Legal />} />
            
            <Route element={<Layout />}>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
              </Route>
              
              {/* Athlete Accessible Routes */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.ATHLETE]} />}>
                 <Route path="/shop" element={<Shop />} />
                 <Route path="/chat" element={<Chat />} />
                 <Route path="/profile" element={<Profile />} />
              </Route>
              
              {/* Shared Routes (Coach, Admin AND Athlete now for self-planning) */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN, UserRole.ATHLETE]} />}>
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/planner" element={<Planner />} />
              </Route>

              {/* Admin Only (Products & Users) */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;