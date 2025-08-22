npx supabase init --force
 
# Login to Supabase
# npx supabase login

# # Link your project
# npx supabase link --project-ref nqesgzdxvyncupwgqxyv

# # Create a new migration ( will do thsi later)
# npx supabase migration new schema_sql
 
# # Run migrations
# npx supabase db push

# # Fetch latest migrations
# npx supabase migration fetch


node src/migrations/run-migrations.js