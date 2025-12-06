import { supabase, User } from './supabase';
import { Linking } from 'react-native';

export interface AuthError {
  message: string;
  code?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  username?: string;
  school?: string;
  age?: number;
  birth_date?: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}

class AuthService {
  private currentUser: User | null = null;
  private currentSession: any | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.currentSession = session;
        await this.fetchUserProfile(session.user.id);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.currentSession = session;
          await this.fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.currentSession = null;
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  private async fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle missing profiles

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      // If no profile exists yet, that's okay during registration
      if (data) {
        this.currentUser = data;
      } else {
        console.log('User profile not found yet - this is normal during registration');
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User | null; error: AuthError | null; needsEmailConfirmation: boolean }> {
    try {
      console.log('🔐 AuthService: Attempting registration for:', credentials.email);
      
      // Create auth user
      // Set autoConfirm to true to skip email verification requirement
      // Note: This only works if email confirmation is disabled in Supabase settings
      // OR if you have a database trigger that auto-confirms emails
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: undefined, // Don't require email redirect
          data: {
            email_verified: true, // Hint that email should be considered verified
          }
        }
      });

      if (authError) {
        console.error('❌ AuthService: Sign up error:', authError);
        
        // Provide more helpful error messages
        let errorMessage = authError.message || 'Registration failed';
        
        if (authError.message?.includes('Network request failed') || 
            authError.message?.includes('Failed to fetch') ||
            authError.message?.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (authError.message?.includes('User already registered') || 
                   authError.message?.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please log in instead.';
        } else if (authError.message?.includes('Password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (authError.message?.includes('Email')) {
          errorMessage = 'Invalid email address. Please check and try again.';
        }
        
        throw new Error(errorMessage);
      }

      if (authData.user) {
        try {
          // Create user profile with minimal required data
          // Other fields will be filled during onboarding
          const profileData: any = {
            id: authData.user.id,
            email: credentials.email,
            full_name: credentials.full_name,
            onboarding_completed: false,
          };

          // Only add optional fields if they have valid values
          if (credentials.username) {
            profileData.username = credentials.username;
          }
          if (credentials.school) {
            profileData.school = credentials.school;
          }
          if (credentials.age && credentials.age > 0) {
            profileData.age = credentials.age;
          }
          if (credentials.birth_date) {
            profileData.birth_date = credentials.birth_date;
          }

          console.log('📝 AuthService: Creating user profile with data:', { 
            id: profileData.id, 
            email: profileData.email, 
            username: profileData.username,
            full_name: profileData.full_name 
          });
          
          // Add timeout to database insert
          const insertPromise = supabase
            .from('users')
            .insert([profileData])
            .select()
            .single();
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database insert timeout')), 15000)
          );
          
          const { data: insertedProfile, error: profileError } = await Promise.race([
            insertPromise,
            timeoutPromise
          ]) as any;

          if (profileError) {
            console.error('❌ AuthService: Profile creation error:', profileError);
            console.error('❌ AuthService: Profile error details:', JSON.stringify(profileError, null, 2));
            
            // Check if it's a duplicate username/email error
            const errorMessage = profileError.message?.toLowerCase() || '';
            const errorCode = profileError.code || '';
            
            if (errorMessage.includes('username') && (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode.includes('23505'))) {
              // Username already exists - can't delete auth user without admin key, but that's okay
              console.warn('⚠️ AuthService: Username already exists, auth user created but profile failed');
              return { 
                user: null, 
                error: { message: 'Username already exists. Please choose a different username.' } as AuthError,
                needsEmailConfirmation: false
              };
            } else if (errorMessage.includes('email') && (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode.includes('23505'))) {
              // Email already exists
              console.warn('⚠️ AuthService: Email already exists, auth user created but profile failed');
              return { 
                user: null, 
                error: { message: 'Email already exists. Please use a different email or sign in.' } as AuthError,
                needsEmailConfirmation: false
              };
            } else if (errorMessage.includes('policy') || errorMessage.includes('row level security') || errorMessage.includes('rls')) {
              // RLS policy error
              console.error('❌ AuthService: RLS policy error - user may not have permission to insert');
              return { 
                user: null, 
                error: { message: 'Registration failed due to security policy. Please contact support.' } as AuthError,
                needsEmailConfirmation: false
              };
            }
            
            // For other errors, return the error message
            return { 
              user: null, 
              error: { message: profileError.message || 'Profile creation failed. Please try again.' } as AuthError,
              needsEmailConfirmation: false
            };
          }

          console.log('✅ AuthService: User profile created successfully:', insertedProfile.id);
          
          // Set the current user
          this.currentUser = insertedProfile;
          
          // Try to get the session to ensure auth state is properly set
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              this.currentSession = sessionData.session;
              console.log('✅ AuthService: Session retrieved after registration');
            }
          } catch (sessionError) {
            console.warn('⚠️ AuthService: Could not retrieve session after registration:', sessionError);
            // Continue anyway - session might be set automatically
          }
          
          return { user: insertedProfile, error: null, needsEmailConfirmation: false };
        } catch (profileError: any) {
          console.error('Profile creation failed:', profileError);
          
          // Check if it's a duplicate error
          const errorMessage = profileError.message?.toLowerCase() || '';
          const errorCode = profileError.code || '';
          
          if (errorMessage.includes('username') && (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode.includes('23505'))) {
            console.warn('⚠️ AuthService: Username already exists in catch block');
            return { 
              user: null, 
              error: { message: 'Username already exists. Please choose a different username.' } as AuthError,
              needsEmailConfirmation: false
            };
          } else if (errorMessage.includes('email') && (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode.includes('23505'))) {
            console.warn('⚠️ AuthService: Email already exists in catch block');
            return { 
              user: null, 
              error: { message: 'Email already exists. Please use a different email or sign in.' } as AuthError,
              needsEmailConfirmation: false
            };
          } else if (errorMessage.includes('policy') || errorMessage.includes('row level security') || errorMessage.includes('rls')) {
            console.error('❌ AuthService: RLS policy error in catch block');
            return { 
              user: null, 
              error: { message: 'Registration failed due to security policy. Please contact support.' } as AuthError,
              needsEmailConfirmation: false
            };
          }
          
          // For other errors, return the error
          return { 
            user: null, 
            error: { message: profileError.message || 'Profile creation failed. Please try again.' } as AuthError,
            needsEmailConfirmation: false
          };
        }
      }

      return { user: null, error: { message: 'Registration failed' }, needsEmailConfirmation: false };
    } catch (error: any) {
      console.error('❌ AuthService: Registration exception:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Registration failed';
      
      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('timeout')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      }
      
      return {
        user: null,
        error: {
          message: errorMessage,
          code: error.code || 'REGISTRATION_ERROR'
        },
        needsEmailConfirmation: false
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      console.log('🔐 AuthService: Attempting login for:', credentials.email);
      
      // Sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('❌ AuthService: Login error:', error);
        console.error('❌ Error code:', error.status || error.code);
        console.error('❌ Error message:', error.message);
        
        // Handle API key errors - try to refresh and continue
        if (error.message?.includes('API key') || 
            error.message?.includes('apikey') ||
            error.message?.includes('Invalid API key') ||
            error.message?.includes('no api key')) {
          console.warn('⚠️ API key error detected, but continuing - Supabase client should handle it');
          // Don't block login - let Supabase handle retry with correct headers
        }
        
        // Handle 401 errors - might be API key or invalid credentials
        if (error.status === 401) {
          // Check if it's an API key issue or invalid credentials
          if (error.message?.includes('API') || error.message?.includes('apikey')) {
            console.warn('⚠️ 401 with API key mention - might be configuration issue');
            // Continue - custom fetch should add headers
          } else {
            // Likely invalid credentials
            return {
              user: null,
              error: {
                message: 'Invalid email or password. Please check your credentials and try again.',
                code: 'INVALID_CREDENTIALS'
              }
            };
          }
        }
        
        // Handle email not confirmed - allow login anyway
        if (error.message?.includes('Email not confirmed') || 
            error.message?.includes('email not verified') ||
            error.message?.includes('not verified')) {
          console.warn('⚠️ Email not confirmed - allowing login to proceed');
          // Don't return error - try to continue
        }
        
        // Handle invalid credentials
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('Invalid credentials') ||
            error.message?.toLowerCase().includes('invalid') && 
            (error.message?.toLowerCase().includes('password') || error.message?.toLowerCase().includes('email'))) {
          return {
            user: null,
            error: {
              message: 'Invalid email or password. Please check your credentials and try again.',
              code: 'INVALID_CREDENTIALS'
            }
          };
        }
        
        // Handle network errors
        if (error.message?.includes('Network request failed') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError')) {
          return {
            user: null,
            error: {
              message: 'Network error. Please check your internet connection and try again.',
              code: 'NETWORK_ERROR'
            }
          };
        }
        
        // Handle rate limiting
        if (error.message?.includes('Too many requests') || 
            error.status === 429) {
          return {
            user: null,
            error: {
              message: 'Too many login attempts. Please wait a moment and try again.',
              code: 'RATE_LIMIT'
            }
          };
        }
        
        // For other errors, provide user-friendly message
        const errorMessage = error.message || 'Login failed. Please try again.';
        return {
          user: null,
          error: {
            message: errorMessage,
            code: error.code || 'LOGIN_ERROR'
          }
        };
      }

      // If we have a user and session, proceed with login
      if (data?.user && data?.session) {
        console.log('✅ AuthService: Login successful, fetching user profile...');
        this.currentSession = data.session;
        await this.fetchUserProfile(data.user.id);
        
        // Return user even if profile fetch fails - they're still logged in
        return { user: this.currentUser || data.user as any, error: null };
      }
      
      // If we have user but no session, try to get session
      if (data?.user) {
        console.log('✅ AuthService: User found, fetching session...');
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          this.currentSession = sessionData.session;
          await this.fetchUserProfile(data.user.id);
          return { user: this.currentUser || data.user as any, error: null };
        }
      }

      return { user: null, error: { message: 'Login failed - no user returned. Please try again.', code: 'NO_USER' } };
    } catch (error: any) {
      console.error('❌ AuthService: Login exception:', error);
      console.error('❌ Exception details:', JSON.stringify(error, null, 2));
      
      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('timeout')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message?.includes('Invalid') || error.message?.includes('credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        user: null,
        error: {
          message: errorMessage,
          code: error.code || 'LOGIN_ERROR'
        }
      };
    }
  }

  async logout(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.currentSession = null;
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Logout failed',
          code: error.code
        }
      };
    }
  }

  async checkEmailConfirmation(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at ? true : false;
    } catch (error) {
      console.error('Error checking email confirmation:', error);
      return false;
    }
  }

  // Save user's selected sprite
  async saveSelectedSprite(sprite: number): Promise<{ error: AuthError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: 'No user logged in', name: 'NoUserError', status: 401 } as AuthError };
      }

      const { error } = await supabase
        .from('users')
        .update({ selected_sprite: sprite })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving selected sprite:', error);
        return { error: error as AuthError };
      }

      console.log('✅ Sprite preference saved:', sprite);
      return { error: null };
    } catch (error) {
      console.error('Error saving sprite:', error);
      return { error: error as AuthError };
    }
  }

  // Load user's selected sprite
  async loadSelectedSprite(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 1; // Default sprite

      const { data, error } = await supabase
        .from('users')
        .select('selected_sprite')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        console.log('No saved sprite, using default');
        return 1;
      }

      console.log('✅ Loaded saved sprite:', data.selected_sprite);
      return data.selected_sprite || 1;
    } catch (error) {
      console.error('Error loading sprite:', error);
      return 1; // Default sprite on error
    }
  }

  async resendConfirmationEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to resend confirmation email',
          code: error.code
        }
      };
    }
  }

  async createUserProfile(credentials: RegisterCredentials, userId: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: credentials.email,
            username: credentials.username,
            school: credentials.school,
            age: credentials.age,
            birth_date: credentials.birth_date,
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      this.currentUser = profileData;
      return { user: profileData, error: null };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'Failed to create user profile',
          code: error.code
        }
      };
    }
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      this.currentUser = data;
      return { user: data, error: null };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'Profile update failed',
          code: error.code
        }
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Get the current user from Supabase auth with timeout
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 2000)
      );
      
      let authResult: any;
      try {
        authResult = await Promise.race([getUserPromise, timeoutPromise]);
      } catch (raceError: any) {
        if (raceError?.message?.includes('timeout')) {
          console.warn('⚠️ getCurrentUser: Auth check timeout, using cached user');
          return this.currentUser;
        }
        throw raceError;
      }
      
      const { data: { user } } = authResult || { data: { user: null } };
      
      if (user) {
        // If we have an auth user, try to get their profile (with timeout)
        try {
          const profilePromise = supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          const profileTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile query timeout')), 1500)
          );
          
          let profileResult: any;
          try {
            profileResult = await Promise.race([profilePromise, profileTimeoutPromise]);
          } catch (profileRaceError: any) {
            if (profileRaceError?.message?.includes('timeout')) {
              console.warn('⚠️ getCurrentUser: Profile query timeout, returning auth user');
              // Return auth user even if profile fetch fails
              return user as any;
            }
            throw profileRaceError;
          }
          
          const { data: profileData, error: profileError } = profileResult || { data: null, error: null };

          if (profileError) {
            console.warn('⚠️ Error fetching user profile:', profileError.message);
            // Return auth user even if profile fetch fails
            return user as any;
          }

          if (profileData) {
            this.currentUser = profileData;
            return profileData;
          }
          
          // No profile but have auth user - return auth user
          return user as any;
        } catch (profileError) {
          console.warn('⚠️ Error fetching user profile:', profileError);
          // Return auth user even if profile fetch fails
          return user as any;
        }
      }
      
      return this.currentUser;
    } catch (error) {
      console.warn('⚠️ Error getting current user:', error);
      return this.currentUser;
    }
  }

  async getCurrentSession(): Promise<any | null> {
    try {
      // Get the current session from Supabase auth with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout')), 2000)
      );
      
      let sessionResult: any;
      try {
        sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
      } catch (raceError: any) {
        if (raceError?.message?.includes('timeout')) {
          console.warn('⚠️ getCurrentSession: Session check timeout, using cached session');
          return this.currentSession;
        }
        throw raceError;
      }
      
      const { data: { session } } = sessionResult || { data: { session: null } };
      this.currentSession = session;
      return session;
    } catch (error) {
      console.warn('⚠️ Error getting current session:', error);
      return this.currentSession;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session !== null;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Password reset failed',
          code: error.code
        }
      };
    }
  }

  async refreshAuthState(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.currentSession = session;
      
      if (session?.user) {
        await this.fetchUserProfile(session.user.id);
      } else {
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      this.currentUser = null;
      this.currentSession = null;
    }
  }

  async loginWithGoogle(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      // Use Supabase's built-in OAuth flow with proper redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://auth.expo.io/@rithdan/geniusapp',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'openid profile email',
          },
        },
      });

      if (error) throw error;

      // If we get a URL back, open it in the browser
      if (data.url) {
        await Linking.openURL(data.url);
        
        // Return success immediately - the redirect will handle the rest
        return { user: null, error: null };
      }

      return { user: null, error: { message: 'Google authentication failed - please try again' } };
    } catch (error: any) {
      console.error('Google login error:', error);
      return {
        user: null,
        error: {
          message: error.message || 'Google authentication failed',
          code: error.code
        }
      };
    }
  }
}

export const authService = new AuthService();
