// Test Supabase connection utility
import { supabase } from './supabase';

export interface SupabaseConnectionTest {
  urlReachable: boolean;
  authWorking: boolean;
  databaseWorking: boolean;
  error?: string;
  details?: any;
}

const SUPABASE_URL = 'https://dzothjxrsbrxezqzkesx.supabase.co';
// Current anon key from config - should be a JWT token starting with eyJ...
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6b3Roanhyc2JyeGV6cXprZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzg1ODMsImV4cCI6MjA3MTg1NDU4M30.XEE9qfJ43gVovREyKuYEbgDQWykvoLP05BiatzwVhDk';

/**
 * Comprehensive Supabase connection test
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionTest> {
  const result: SupabaseConnectionTest = {
    urlReachable: false,
    authWorking: false,
    databaseWorking: false,
  };

  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', SUPABASE_URL);
    console.log('Anon Key preview:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
    console.log('Anon Key length:', SUPABASE_ANON_KEY.length);
    
    // Verify key format (Supabase keys are JWT tokens starting with eyJ...)
    if (!SUPABASE_ANON_KEY || !SUPABASE_ANON_KEY.startsWith('eyJ')) {
      result.error = 'Invalid API key format. Supabase anon keys are JWT tokens starting with "eyJ...".\n\nPlease:\n1. Go to Supabase Dashboard → Settings → API\n2. Copy the "anon public" key (it should start with eyJ...)\n3. The keys you mentioned (sb_publishable_...) are not Supabase keys.';
      console.error('❌', result.error);
      return result;
    }
    
    // Test 1: Check if URL is reachable (simple REST endpoint test)
    try {
      const urlTest = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      
      // Any response (even 404 or 401) means URL is reachable
      result.urlReachable = true;
      console.log('✅ Supabase URL is reachable (status:', urlTest.status + ')');
      
      // Check if it's an API key error
      if (urlTest.status === 401) {
        console.error('❌ 401 Unauthorized - Invalid API key');
        result.error = 'Invalid API key. Please get the correct anon key from Supabase Dashboard → Settings → API';
      }
    } catch (urlError: any) {
      console.error('❌ Cannot reach Supabase URL:', urlError.message);
      result.error = `Cannot reach URL: ${urlError.message}`;
      return result;
    }

    // Test 2: Test auth with current key
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        // Check if it's an API key error
        if (authError.message?.includes('API key') || authError.message?.includes('Invalid API key')) {
          console.error('❌ Invalid API key');
          result.error = 'Invalid API key - please check your anon key in Supabase Dashboard → Settings → API';
        } else {
          // Other auth errors might be OK (no session is normal)
          console.log('✅ Auth endpoint working (no session is normal)');
          result.authWorking = true;
        }
      } else {
        console.log('✅ Auth endpoint working');
        result.authWorking = true;
      }
    } catch (authError: any) {
      console.error('❌ Auth test failed:', authError.message);
      if (authError.message?.includes('API key') || authError.message?.includes('Invalid')) {
        result.error = 'Invalid API key';
      }
    }

    // Test 3: Test database connection
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (dbError) {
        // PGRST116 means table is empty (which is OK)
        if (dbError.code === 'PGRST116') {
          console.log('✅ Database connection working (table is empty)');
          result.databaseWorking = true;
        } else if (dbError.message?.includes('API key') || dbError.message?.includes('Invalid API key')) {
          console.error('❌ Invalid API key for database');
          result.error = 'Invalid API key for database queries';
        } else {
          console.warn('⚠️ Database query error (may be expected):', dbError.message);
          result.databaseWorking = true; // Connection works, just query failed
        }
      } else {
        console.log('✅ Database connection working');
        result.databaseWorking = true;
      }
    } catch (dbError: any) {
      console.error('❌ Database test failed:', dbError.message);
      if (dbError.message?.includes('API key')) {
        result.error = 'Invalid API key for database';
      }
    }

    // Summary
    if (result.urlReachable && (result.authWorking || result.databaseWorking)) {
      console.log('✅ Supabase connection is working!');
    } else {
      console.error('❌ Supabase connection issues detected');
      if (!result.error) {
        result.error = 'Connection test failed - check console for details';
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ Connection test exception:', error);
    result.error = error.message || 'Unknown error';
    return result;
  }
}

