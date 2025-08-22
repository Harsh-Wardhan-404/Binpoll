const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');
const config = require('./environment');

// Create database connection using the configuration
const sql = postgres(config.databaseUrl, {
  // Connection options
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  
  // SSL configuration for production
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
  
  // Connection event handlers
  onnotice: () => {}, // Suppress notice messages
  onparameter: () => {}, // Suppress parameter messages
});

// Create Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Test connection function
const testConnection = async () => {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  sql,
  supabase,
  testConnection
};
