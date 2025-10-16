# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `rapidfunds`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" → "API"
3. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## 3. Create Environment File

Create a file called `.env` in the `client` directory with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials.

## 4. Set Up Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#0EA5E9',
  secondary_color VARCHAR(7) DEFAULT '#10B981',
  custom_fields JSONB DEFAULT '[]',
  checklist_templates JSONB DEFAULT '[]',
  approval_rules JSONB DEFAULT '[]',
  default_digest_time VARCHAR(5) DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  phone_number VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('Admin', 'Approver', 'Finance', 'Member', 'Requester')) NOT NULL,
  department VARCHAR(255),
  digest_time VARCHAR(5) DEFAULT '09:00',
  notification_preferences JSONB DEFAULT '{"push": true, "email": true}',
  is_online BOOLEAN DEFAULT false,
  custom_fields_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Org Chart Nodes table
CREATE TABLE org_chart_nodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  parent_id UUID REFERENCES org_chart_nodes(id) ON DELETE CASCADE,
  hierarchy_level_id UUID,
  position JSONB DEFAULT '{"x": 0, "y": 0}',
  color VARCHAR(7) DEFAULT '#0EA5E9',
  shape VARCHAR(20) DEFAULT 'rectangle',
  level INTEGER DEFAULT 1,
  budget_responsibility VARCHAR(50),
  email VARCHAR(255),
  profile_picture TEXT,
  is_expanded BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  reporting_manager VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_org_chart_nodes_org_id ON org_chart_nodes(org_id);
CREATE INDEX idx_org_chart_nodes_parent_id ON org_chart_nodes(parent_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_chart_nodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - you may want to customize these)
CREATE POLICY "Users can view their own org data" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view users in their org" ON users
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view org chart in their org" ON org_chart_nodes
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- Insert demo data
INSERT INTO organizations (org_code, name, primary_color, secondary_color) 
VALUES ('DEMO', 'Demo Organization', '#0EA5E9', '#10B981');

-- Get the demo org ID for the next insert
DO $$
DECLARE
    demo_org_id UUID;
BEGIN
    SELECT id INTO demo_org_id FROM organizations WHERE org_code = 'DEMO';
    
    -- Insert demo admin user (password is hashed 'demo123')
    INSERT INTO users (org_id, email, password, full_name, role, department)
    VALUES (
        demo_org_id,
        'admin@demo.com',
        'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- SHA256 hash of 'demo123'
        'Demo Admin',
        'Admin',
        'Administration'
    );
    
    -- Insert demo org chart nodes
    INSERT INTO org_chart_nodes (org_id, name, role, department, level, budget_responsibility, email, position)
    VALUES 
        (demo_org_id, 'Allan Munger', 'Process Optimization Lead', 'Executive', 1, '$2.5M', 'allanmunger@rapidfunds.com', '{"x": 0, "y": 0}'),
        (demo_org_id, 'Kayo', 'Chief People Officer', 'Human Resources & Admin', 2, '$1.2M', 'kayo@rapidfunds.com', '{"x": -200, "y": 100}'),
        (demo_org_id, 'Daisy Phillips', 'Senior Procurement Executive', 'Operations Department', 2, '$1.2M', 'daisyphillips@rapidfunds.com', '{"x": 200, "y": 100}'),
        (demo_org_id, 'David Power', 'Administrator', 'Human Resources & Admin', 3, '$500K', 'davidpower@rapidfunds.com', '{"x": -200, "y": 200}'),
        (demo_org_id, 'Ashley McCarthy', 'Procurement Assistant', 'Operations Department', 3, '$500K', 'ashleymccarthy@rapidfunds.com', '{"x": 200, "y": 200}');
END $$;
```

## 5. Update Your App to Use Supabase

The app is already set up to work with both IndexedDB (current) and Supabase. To switch to Supabase:

1. Complete steps 1-4 above
2. The app will automatically detect your Supabase credentials and use them instead of IndexedDB
3. All your data will be stored in Supabase and synced across devices

## 6. Test the Connection

1. Start your development server: `npm run dev`
2. Go to http://localhost:3000
3. Login with: `admin@demo.com` / `demo123`
4. Your data should now be stored in Supabase!

## Troubleshooting

- Make sure your `.env` file is in the `client` directory
- Check that your Supabase URL and key are correct
- Verify that the database tables were created successfully
- Check the browser console for any connection errors
