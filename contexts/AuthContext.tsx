import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { authService, User, AuthState } from '../services/authService';
import { supabase } from '../services/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  loginWithGoogle: () => Promise<{ user: User | null; error: string | null }>;
  register: (userData: any) => Promise<{ user: User | null; error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ user: User | null; error: string | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>;
  refreshAuth: () => Promise<void>;
  needsOnboarding: boolean;
  onboardingChecked: boolean;
  checkOnboardingStatus: (force?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthContext: Initializing auth...');
        
        // AGGRESSIVE TIMEOUT: Force loading to false within 1 second
        const initTimeout = setTimeout(() => {
          console.warn('⚠️ AuthContext: Initialization timeout (1s), forcing loading to false');
          setAuthState(prev => ({
            ...prev,
            loading: false
          }));
        }, 1000); // 1 second timeout - very aggressive
        
        // Try to get user and session, but don't wait too long
        try {
          const userPromise = authService.getCurrentUser().catch(err => {
            console.warn('⚠️ getCurrentUser error:', err);
            return null;
          });
          const sessionPromise = authService.getCurrentSession().catch(err => {
            console.warn('⚠️ getCurrentSession error:', err);
            return null;
          });
          
          const fastTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 800)
          );
          
          let user: any = null;
          let session: any = null;
          
          try {
            const result = await Promise.race([
              Promise.all([userPromise, sessionPromise]),
              fastTimeout
            ]) as [any, any];
            
            user = result[0];
            session = result[1];
          } catch (raceError: any) {
            // Timeout or error - use null values
            console.warn('⚠️ AuthContext: Auth check timeout/error, using null values');
            user = null;
            session = null;
          }
          
          clearTimeout(initTimeout);
          
          console.log('✅ AuthContext: Auth initialized', { 
            hasUser: !!user, 
            hasSession: !!session 
          });
          
          setAuthState({
            user,
            session,
            loading: false,
          });
        } catch (raceError: any) {
          // If any error, just set loading to false with null values
          clearTimeout(initTimeout);
          console.warn('⚠️ AuthContext: Auth check failed, setting loading to false');
          setAuthState({
            user: null,
            session: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('❌ AuthContext: Auth initialization error:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { user, error } = await authService.login({ email, password });
      
      if (error) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { user: null, error: error.message };
      }

      if (user) {
        const session = await authService.getCurrentSession();
        setAuthState({
          user,
          session,
          loading: false,
        });
        return { user, error: null };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { user: null, error: 'Login failed' };
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { user: null, error: 'An unexpected error occurred' };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { user, error } = await authService.loginWithGoogle();
      
      if (error) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { user: null, error: error.message };
      }

      if (user) {
        const session = await authService.getCurrentSession();
        setAuthState({
          user,
          session,
          loading: false,
        });
        return { user, error: null };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { user: null, error: 'Google login failed' };
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { user: null, error: 'An unexpected error occurred during Google login' };
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    try {
      console.log('🔐 AuthContext: Starting registration...');
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { user, error } = await authService.register(userData);
      
      if (error) {
        console.error('❌ AuthContext: Registration error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { user: null, error: error.message };
      }

      if (user) {
        console.log('✅ AuthContext: Registration successful, user:', user.id);
        const session = await authService.getCurrentSession();
        console.log('📝 AuthContext: Got session:', !!session);
        setAuthState({
          user,
          session,
          loading: false,
        });
        console.log('✅ AuthContext: Auth state updated');
        return { user, error: null };
      }

      console.warn('⚠️ AuthContext: No user returned from registration');
      setAuthState(prev => ({ ...prev, loading: false }));
      return { user: null, error: 'Registration failed' };
    } catch (error) {
      console.error('❌ AuthContext: Unexpected registration error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { user: null, error: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { error } = await authService.logout();
      
      if (error) {
        console.error('Logout error:', error.message);
      }

      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const { user, error } = await authService.updateProfile(updates);
      
      if (error) {
        return { user: null, error: error.message };
      }

      if (user) {
        setAuthState(prev => ({ ...prev, user }));
        return { user, error: null };
      }

      return { user: null, error: 'Profile update failed' };
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' };
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    try {
      const { error } = await authService.resendConfirmationEmail(email);
      
      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to resend confirmation email' };
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      await authService.refreshAuthState();
      const user = await authService.getCurrentUser();
      const session = await authService.getCurrentSession();
      
      setAuthState({
        user,
        session,
        loading: false,
      });
      
      // Reset onboarding check when auth refreshes
      setOnboardingChecked(false);
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
      setOnboardingChecked(false);
    }
  }, []);

  const checkOnboardingStatus = useCallback(async (force = false) => {
    console.log('🔍 AuthContext: checkOnboardingStatus called', {
      force,
      onboardingChecked,
      hasUser: !!authState.user,
      userId: authState.user?.id,
      authLoading: authState.loading
    });

    if ((onboardingChecked && !force) || !authState.user || authState.loading) {
      console.log('🔍 AuthContext: Skipping onboarding check', {
        reason: (onboardingChecked && !force) ? 'already checked' : !authState.user ? 'no user' : 'auth loading'
      });
      return;
    }

    try {
      console.log('🔍 AuthContext: Checking onboarding status for user:', authState.user.id);
      
      // Add timeout to the database query
      const queryPromise = supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', authState.user.id)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 3000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ AuthContext: Database error:', error);
        setNeedsOnboarding(true);
      } else if (!data) {
        console.log('⚠️ AuthContext: No user profile found, needs onboarding');
        setNeedsOnboarding(true);
      } else if (!data.onboarding_completed) {
        console.log('➡️ AuthContext: User needs onboarding');
        setNeedsOnboarding(true);
      } else {
        console.log('✅ AuthContext: Onboarding completed');
        setNeedsOnboarding(false);
      }
      
      setOnboardingChecked(true);
    } catch (error) {
      console.error('❌ AuthContext: Error checking onboarding:', error);
      setNeedsOnboarding(true);
      setOnboardingChecked(true);
    }
  }, [authState.user, authState.loading, onboardingChecked]);

  const value: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    resendConfirmationEmail,
    refreshAuth,
    needsOnboarding,
    onboardingChecked,
    checkOnboardingStatus,
  }), [authState, login, loginWithGoogle, register, logout, updateProfile, resendConfirmationEmail, refreshAuth, needsOnboarding, onboardingChecked, checkOnboardingStatus]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
