const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Read and execute migration file
    const migrationPath = path.join(__dirname, '001_create_tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('Database migrations completed successfully!');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
