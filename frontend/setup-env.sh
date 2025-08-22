#!/bin/bash

# Create .env file for frontend
cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Supabase Configuration (you need to add your actual values)
VITE_SUPABASE_URL=https://nqesgzdxvyncupwgqxyv.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF

echo "Created .env file with default values"
echo "Please update VITE_SUPABASE_ANON_KEY with your actual Supabase anon key"
