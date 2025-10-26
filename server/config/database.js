import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rapidfunds',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
export const db = new Pool(dbConfig);

// Test database connection
db.on('connect', () => {
  console.log('📊 Connected to PostgreSQL database');
});

db.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database tables...');
    
    // Create organizations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        org_code VARCHAR(50) UNIQUE NOT NULL,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        settings JSONB DEFAULT '{}'
      )
    `);

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Member',
        department VARCHAR(100),
        job_title VARCHAR(100),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        preferences JSONB DEFAULT '{}'
      )
    `);

    // Create funding_requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS funding_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
        approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Open',
        priority VARCHAR(20) DEFAULT 'Medium',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create org_chart_nodes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS org_chart_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        department VARCHAR(100),
        level INTEGER NOT NULL DEFAULT 1,
        parent_id UUID REFERENCES org_chart_nodes(id) ON DELETE SET NULL,
        position JSONB DEFAULT '{"x": 0, "y": 0}',
        color VARCHAR(20) DEFAULT 'blue',
        shape VARCHAR(20) DEFAULT 'rectangle',
        is_expanded BOOLEAN DEFAULT true,
        is_approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create query_messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS query_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID REFERENCES funding_requests(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_funding_requests_org_id ON funding_requests(org_id);
      CREATE INDEX IF NOT EXISTS idx_funding_requests_requester_id ON funding_requests(requester_id);
      CREATE INDEX IF NOT EXISTS idx_funding_requests_approver_id ON funding_requests(approver_id);
      CREATE INDEX IF NOT EXISTS idx_funding_requests_status ON funding_requests(status);
      CREATE INDEX IF NOT EXISTS idx_org_chart_nodes_org_id ON org_chart_nodes(org_id);
      CREATE INDEX IF NOT EXISTS idx_org_chart_nodes_user_id ON org_chart_nodes(user_id);
      CREATE INDEX IF NOT EXISTS idx_org_chart_nodes_parent_id ON org_chart_nodes(parent_id);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Seed initial data
export const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with initial data...');
    
    // Check if data already exists
    const orgCount = await db.query('SELECT COUNT(*) FROM organizations');
    if (parseInt(orgCount.rows[0].count) > 0) {
      console.log('📊 Database already has data, skipping seeding');
      return;
    }

    // Create demo organization
    const orgResult = await db.query(`
      INSERT INTO organizations (name, org_code, created_by)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['Demo Organization', 'DEMO001', null]);

    const orgId = orgResult.rows[0].id;

    // Create demo admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminResult = await db.query(`
      INSERT INTO users (org_id, email, password_hash, full_name, role, department, job_title, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [orgId, 'admin@demo.com', hashedPassword, 'Admin User', 'Admin', 'Management', 'CEO', true, true]);

    const adminId = adminResult.rows[0].id;

    // Update organization with created_by
    await db.query(`
      UPDATE organizations SET created_by = $1 WHERE id = $2
    `, [adminId, orgId]);

    // Create demo members
    const members = [
      ['john@demo.com', 'John Doe', 'Member', 'Engineering', 'Developer'],
      ['jane@demo.com', 'Jane Smith', 'Approver', 'Finance', 'CFO'],
      ['bob@demo.com', 'Bob Johnson', 'Member', 'Marketing', 'Manager']
    ];

    for (const [email, name, role, dept, title] of members) {
      const memberPassword = await bcrypt.hash('demo123', 10);
      await db.query(`
        INSERT INTO users (org_id, email, password_hash, full_name, role, department, job_title, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [orgId, email, memberPassword, name, role, dept, title, true, true]);
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
