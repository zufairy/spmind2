// Database connection test utility
import { supabase } from './supabase';

export interface DatabaseConnectionStatus {
  connected: boolean;
  error?: string;
  rpcFunctionsExist: boolean;
  details?: any;
}

/**
 * Test database connection and verify RPC functions exist
 */
export async function testDatabaseConnection(): Promise<DatabaseConnectionStatus> {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Basic connection - try to query users table
    const { data: connectionData, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      // PGRST116 means table is empty (which is OK)
      if (connectionError.code === 'PGRST116') {
        console.log('✅ Database connection OK (table is empty)');
      } else {
        console.error('❌ Database connection error:', connectionError);
        return {
          connected: false,
          error: `Database connection failed: ${connectionError.message}`,
          rpcFunctionsExist: false,
          details: connectionError
        };
      }
    } else {
      console.log('✅ Database connection OK');
    }
    
    // Test 2: Check if RPC functions exist
    let rpcFunctionsExist = false;
    try {
      const { data: usernameCheck, error: rpcError } = await supabase
        .rpc('check_username_exists', { username_to_check: '__TEST_USERNAME_THAT_DOES_NOT_EXIST__' });
      
      if (rpcError) {
        if (rpcError.message?.includes('function') || rpcError.code === '42883' || rpcError.code === 'P0001') {
          console.error('❌ RPC function check_username_exists does not exist');
          console.error('Error:', rpcError);
        } else {
          // Other errors might be OK (like permission errors)
          console.log('⚠️ RPC function exists but returned error (may be expected):', rpcError.message);
          rpcFunctionsExist = true;
        }
      } else {
        console.log('✅ RPC function check_username_exists exists');
        rpcFunctionsExist = true;
      }
    } catch (rpcTestError: any) {
      console.error('❌ Error testing RPC function:', rpcTestError);
    }
    
    return {
      connected: true,
      rpcFunctionsExist,
      details: {
        connectionTest: connectionError ? null : 'OK',
        rpcTest: rpcFunctionsExist ? 'OK' : 'MISSING'
      }
    };
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error);
    return {
      connected: false,
      error: error.message || 'Unknown error',
      rpcFunctionsExist: false,
      details: error
    };
  }
}

