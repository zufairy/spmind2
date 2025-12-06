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

// Track offline status
let offlineLogged = false;

// Enhanced fetch - returns graceful response when offline instead of throwing
const customFetch = async (url: string, options: any = {}) => {
  const maxRetries = 2;
  const timeoutMs = 5000; // 5 second timeout for faster feedback

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const existingHeaders = options.headers || {};
        const hasApiKey = existingHeaders['apikey'] || existingHeaders['Apikey'] || existingHeaders['APIKEY'];
        
        const headers: any = { ...existingHeaders };
        
        if (url.includes('supabase.co')) {
          if (!hasApiKey) {
            headers['apikey'] = supabaseAnonKey;
          }
          if (!headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
          }
        }
        
        if (options.body && !headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers,
        });

        clearTimeout(timeoutId);
        offlineLogged = false; // Reset on success
        return response;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        const isOffline = 
          fetchError.name === 'AbortError' ||
          fetchError?.message?.includes('Network request failed') ||
          fetchError?.message?.includes('Failed to fetch') ||
          fetchError?.message?.includes('NetworkError');
        
        if (isOffline && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        // Return offline response instead of throwing
        if (isOffline) {
          if (!offlineLogged) {
            console.warn('📴 Device offline - returning empty response');
            offlineLogged = true;
          }
          return new Response(JSON.stringify({ data: null, error: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      if (attempt === maxRetries - 1) {
        // Return offline response instead of throwing
        if (!offlineLogged) {
          console.warn('📴 Network unavailable - returning empty response');
          offlineLogged = true;
        }
        return new Response(JSON.stringify({ data: null, error: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  return new Response(JSON.stringify({ data: null, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
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
      'X-Client-Info': 'spmindapp-mobile',
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
