require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  databaseUrl: process.env.DATABASE_URL ,
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || 'https://nqesgzdxvyncupwgqxyv.supabase.co',
    anonKey: process.env.SUPABASE_API_KEY || 'your_supabase_anon_key_here',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here'
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here_please_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // CORS Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Security
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

module.exports = config;
