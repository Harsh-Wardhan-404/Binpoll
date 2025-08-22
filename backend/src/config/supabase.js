const { createClient } = require('@supabase/supabase-js');
const config = require('./environment');

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create Supabase client with anon key for regular operations
const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

module.exports = {
  supabase,      // Admin client for server operations
  supabaseClient // Regular client for user operations
};
