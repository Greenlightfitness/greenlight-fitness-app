import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getProfile } from '../services/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  // Role switching for dual-role users
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  canSwitchRole: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
  activeRole: null,
  setActiveRole: () => {},
  canSwitchRole: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);

  // Check if user can switch roles (has both primary and secondary role)
  const canSwitchRole = !!(userProfile?.secondaryRole && userProfile.secondaryRole !== userProfile.role);

  const setActiveRole = (role: UserRole) => {
    if (userProfile && (role === userProfile.role || role === userProfile.secondaryRole)) {
      setActiveRoleState(role);
      // Persist to localStorage for session continuity
      localStorage.setItem('greenlight_active_role', role);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const profile = await getProfile(userId);
      if (profile) {
        // Map snake_case to camelCase for compatibility
        const mappedProfile: UserProfile = {
          uid: profile.id,
          email: profile.email || '',
          role: profile.role as UserRole || UserRole.ATHLETE,
          secondaryRole: profile.secondary_role as UserRole | undefined,
          displayName: profile.display_name,
          firstName: profile.first_name,
          lastName: profile.last_name,
          nickname: profile.nickname,
          gender: profile.gender,
          birthDate: profile.birth_date,
          height: profile.height,
          weight: profile.weight,
          waistCircumference: profile.waist_circumference,
          bodyFat: profile.body_fat,
          restingHeartRate: profile.resting_heart_rate,
          maxHeartRate: profile.max_heart_rate,
          onboardingCompleted: profile.onboarding_completed,
          avatarUrl: profile.avatar_url,
          biography: profile.biography,
          createdAt: profile.created_at,
        };
        setUserProfile(mappedProfile);
        
        // Set active role from localStorage or default to primary role
        const savedRole = localStorage.getItem('greenlight_active_role') as UserRole | null;
        if (savedRole && (savedRole === mappedProfile.role || savedRole === mappedProfile.secondaryRole)) {
          setActiveRoleState(savedRole);
        } else {
          setActiveRoleState(mappedProfile.role);
        }
      } else {
        console.warn('User profile not found in database');
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Verify user exists in profiles table
        const profile = await getProfile(session.user.id);
        if (profile) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          // No profile found - sign out invalid session
          console.warn('No profile found for user, signing out');
          await supabase.auth.signOut();
          setUser(null);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Small delay to allow trigger to create profile
          if (event === 'SIGNED_IN') {
            setTimeout(() => fetchProfile(session.user.id), 500);
          } else {
            await fetchProfile(session.user.id);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile, activeRole, setActiveRole, canSwitchRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};