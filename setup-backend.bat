@echo off
echo 🚀 RapidFunds Backend Setup
echo ==========================

echo.
echo 📋 Prerequisites:
echo - PostgreSQL must be installed and running
echo - Default database: rapidfunds
echo - Default user: postgres
echo - Default password: password
echo.

echo 🔧 Setting up database...
echo Please make sure PostgreSQL is running and accessible.

echo.
echo 📊 Testing database connection...
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432
});

pool.query('SELECT version()', (err, res) => {
  if (err) {
    console.log('❌ Database connection failed:', err.message);
    console.log('');
    console.log('🔧 Please check:');
    console.log('1. PostgreSQL is installed and running');
    console.log('2. Database credentials are correct');
    console.log('3. Port 5432 is accessible');
    process.exit(1);
  } else {
    console.log('✅ Database connection successful!');
    console.log('📊 PostgreSQL version:', res.rows[0].version);
    
    // Create database if it doesn't exist
    pool.query('CREATE DATABASE rapidfunds', (err, res) => {
      if (err && err.code !== '42P04') {
        console.log('❌ Failed to create database:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Database \"rapidfunds\" is ready!');
        console.log('');
        console.log('🎉 Setup complete! You can now run:');
        console.log('   npm run dev');
        process.exit(0);
      }
    });
  }
});
"

pause
