-- Fix RLS policy for votes table to allow backend inserts
-- Migration: Update votes RLS policy for service role access

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;

-- Create a new policy that allows inserts from service role
-- This allows our backend to insert votes on behalf of authenticated users
CREATE POLICY "Allow vote creation" ON votes
  FOR INSERT WITH CHECK (
    -- Allow if user is authenticated through Supabase Auth
    auth.role() = 'authenticated' 
    OR 
    -- Allow if using service role (our backend with verified user)
    auth.role() = 'service_role'
  );

-- Comment: This policy allows both direct user inserts and backend inserts
-- The backend verifies users through JWT middleware before inserting votes
