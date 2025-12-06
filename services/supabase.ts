import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { Database } from '../src/types/database.types';

// Supabase credentials
// URL: https://dzothjxrsbrxezqzkesx.supabase.co
const supabaseUrl = 'https://dzothjxrsbrxezqzkesx.supabase.co';

// Anon Key (Public Key) - Get this from Supabase Dashboard → Settings → API → anon public
// Format should be a JWT token starting with "eyJ..."
// If your project was paused/resumed, you may need to get a new key
// To update: Get fresh key from Supabase Dashboard → Settings → API → anon public
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6b3Roanhyc2JyeGV6cXprZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzg1ODMsImV4cCI6MjA3MTg1NDU4M30.XEE9qfJ43gVovREyKuYEbgDQWykvoLP05BiatzwVhDk';

// Log key status on initialization (only once)
if (!global.__SUPABASE_KEY_LOGGED__) {
  const keySource = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'environment variable' : 'hardcoded fallback';
  console.log('🔑 Supabase Anon Key loaded from:', keySource);
  console.log('🔑 Key preview:', supabaseAnonKey.substring(0, 20) + '...');
  console.log('🔑 Key length:', supabaseAnonKey.length);
  console.log('🔑 Key format valid:', supabaseAnonKey.startsWith('eyJ') ? '✅ Yes' : '❌ No');
  global.__SUPABASE_KEY_LOGGED__ = true;
}

// Enhanced fetch with retry logic and better error handling
const customFetch = async (url: string, options: any = {}) => {
  const maxRetries = 3;
  const timeoutMs = 15000; // 15 second timeout

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Preserve all headers from options
        const existingHeaders = options.headers || {};
        
        // Create headers object, preserving all existing headers
        // Check both 'apikey' and 'apikey' (case variations) and 'Authorization'
        const hasApiKey = existingHeaders['apikey'] || existingHeaders['Apikey'] || existingHeaders['APIKEY'];
        
        const headers: any = {
          ...existingHeaders,
        };
        
        // For Supabase requests, ALWAYS ensure apikey and Authorization headers are set
        if (url.includes('supabase.co')) {
          // Always ensure apikey header is present
          if (!hasApiKey) {
            headers['apikey'] = supabaseAnonKey;
          }
          
          // Always ensure Authorization header with Bearer token is present
          if (!headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
          }
          
          // Verify API key is valid format (only log warning once)
          if (!global.__SUPABASE_KEY_WARNING_LOGGED__) {
            if (!supabaseAnonKey || !supabaseAnonKey.startsWith('eyJ')) {
              console.error('❌ WARNING: Supabase anon key appears invalid (should start with eyJ...)');
              global.__SUPABASE_KEY_WARNING_LOGGED__ = true;
            }
          }
        }
        
        // Only set Content-Type if not already set and if there's a body
        if (options.body && !headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers,
        });

        clearTimeout(timeoutId);

        // If response is ok, return it
        if (response.ok) {
          return response;
        }

        // For client errors (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        // For server errors (5xx), retry if we have attempts left
        if (response.status >= 500 && attempt < maxRetries - 1) {
          throw new Error(`Server error: ${response.status}`);
        }

        return response;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Check if it was aborted (timeout)
        if (fetchError.name === 'AbortError') {
          const timeoutError = new Error('Request timeout - please check your internet connection');
          if (attempt < maxRetries - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`⏱️ Request timeout (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw timeoutError;
        }
        
        // Check if it's a network error
        const isNetworkError = 
          fetchError?.message?.includes('Network request failed') ||
          fetchError?.message?.includes('Failed to fetch') ||
          fetchError?.message?.includes('NetworkError') ||
          fetchError?.code === 'NETWORK_ERROR' ||
          fetchError?.name === 'NetworkError' ||
          fetchError?.message?.includes('ECONNREFUSED') ||
          fetchError?.message?.includes('ENOTFOUND');
        
        if (isNetworkError) {
          // If not the last attempt, wait and retry
          if (attempt < maxRetries - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
            console.log(`⚠️ Network request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            // Last attempt failed - provide helpful error
            throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
          }
        }
        
        // For other errors, throw immediately
        throw fetchError;
      }
    } catch (error: any) {
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        console.error(`❌ Network request failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      // For non-network errors on early attempts, also retry once
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`⚠️ Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }

  // Should not reach here
  throw new Error('Network request failed');
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    fetch: customFetch,
    headers: {
      'X-Client-Info': 'geniusapp-mobile',
    },
  },
  db: {
    schema: 'public',
  },
});

// Re-export types from database.types.ts for convenience
export type {
  Database,
  User,
  UserInsert,
  UserUpdate,
  Note,
  NoteInsert,
  NoteUpdate,
  StickyNote,
  StickyNoteInsert,
  StickyNoteUpdate,
  RecordingSession,
  RecordingSessionInsert,
  RecordingSessionUpdate,
  SessionStickyNote,
  SessionStickyNoteInsert,
  SessionStickyNoteUpdate,
  SessionParticipant,
  SessionParticipantInsert,
  SessionParticipantUpdate,
  UserProgress,
  UserProgressInsert,
  UserProgressUpdate,
  AISession,
  AISessionInsert,
  AISessionUpdate,
} from '../src/types/database.types';
