-- RapidFunds Supabase Database Schema
-- Run this in your Supabase SQL Editor

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
    password TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'Member' CHECK (role IN ('Admin', 'Approver', 'Finance', 'Member')),
    department VARCHAR(255),
    digest_time VARCHAR(5) DEFAULT '09:00',
    notification_preferences JSONB DEFAULT '{"push": true, "email": true}',
    is_online BOOLEAN DEFAULT false,
    custom_fields_data JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

-- Approval chains table
CREATE TABLE approval_chains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    category VARCHAR(255),
    is_default BOOLEAN DEFAULT false,
    levels JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funding requests table
CREATE TABLE funding_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) DEFAULT 'Other' CHECK (category IN ('Advance', 'Reimbursement', 'Vendor', 'Budget', 'Other')),
    custom_category VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Needs Info', 'Approved', 'Rejected', 'Closed')),
    current_approval_level INTEGER DEFAULT 0,
    approval_chain_id UUID REFERENCES approval_chains(id) ON DELETE SET NULL,
    participants TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    checklist JSONB DEFAULT '[]',
    ai_summary TEXT,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval history table
CREATE TABLE approval_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES funding_requests(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    approver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Approved', 'Rejected', 'RequestInfo', 'Overridden')),
    comments TEXT,
    is_fast_track BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query messages table
CREATE TABLE query_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES funding_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system_event')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hierarchy levels table
CREATE TABLE hierarchy_levels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level_order INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#0EA5E9',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Org chart nodes table
CREATE TABLE org_chart_nodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    parent_id UUID REFERENCES org_chart_nodes(id) ON DELETE SET NULL,
    hierarchy_level_id UUID REFERENCES hierarchy_levels(id) ON DELETE SET NULL,
    position JSONB DEFAULT '{"x": 0, "y": 0}',
    color VARCHAR(7) DEFAULT '#0EA5E9',
    shape VARCHAR(20) DEFAULT 'rectangle' CHECK (shape IN ('rectangle', 'circle', 'rounded'))
);

-- Invite tokens table
CREATE TABLE invite_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Approver', 'Requester')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verifications table
CREATE TABLE email_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password resets table
CREATE TABLE password_resets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_funding_requests_org_id ON funding_requests(org_id);
CREATE INDEX idx_funding_requests_requester_id ON funding_requests(requester_id);
CREATE INDEX idx_funding_requests_approver_id ON funding_requests(approver_id);
CREATE INDEX idx_funding_requests_status ON funding_requests(status);
CREATE INDEX idx_approval_history_request_id ON approval_history(request_id);
CREATE INDEX idx_query_messages_request_id ON query_messages(request_id);
CREATE INDEX idx_org_chart_nodes_org_id ON org_chart_nodes(org_id);
CREATE INDEX idx_invite_tokens_org_id ON invite_tokens(org_id);
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- Row Level Security (RLS) policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_chart_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Users policies
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can insert users in their organization" ON users
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Funding requests policies
CREATE POLICY "Users can view requests in their organization" ON funding_requests
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create requests in their organization" ON funding_requests
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update requests they created or are assigned to" ON funding_requests
    FOR UPDATE USING (
        requester_id = auth.uid() OR 
        approver_id = auth.uid() OR
        id = ANY(
            SELECT unnest(participants)::uuid FROM funding_requests 
            WHERE id = funding_requests.id
        )
    );

-- Approval history policies
CREATE POLICY "Users can view approval history for requests in their organization" ON approval_history
    FOR SELECT USING (
        request_id IN (
            SELECT id FROM funding_requests 
            WHERE org_id IN (
                SELECT org_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create approval history for requests they can approve" ON approval_history
    FOR INSERT WITH CHECK (
        approver_id = auth.uid() AND
        request_id IN (
            SELECT id FROM funding_requests 
            WHERE org_id IN (
                SELECT org_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Query messages policies
CREATE POLICY "Users can view messages for requests in their organization" ON query_messages
    FOR SELECT USING (
        request_id IN (
            SELECT id FROM funding_requests 
            WHERE org_id IN (
                SELECT org_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create messages for requests in their organization" ON query_messages
    FOR INSERT WITH CHECK (
        request_id IN (
            SELECT id FROM funding_requests 
            WHERE org_id IN (
                SELECT org_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Org chart nodes policies
CREATE POLICY "Users can view org chart for their organization" ON org_chart_nodes
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage org chart for their organization" ON org_chart_nodes
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Invite tokens policies
CREATE POLICY "Admins can manage invite tokens for their organization" ON invite_tokens
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Approval chains policies
CREATE POLICY "Users can view approval chains for their organization" ON approval_chains
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage approval chains for their organization" ON approval_chains
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Hierarchy levels policies
CREATE POLICY "Users can view hierarchy levels for their organization" ON hierarchy_levels
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage hierarchy levels for their organization" ON hierarchy_levels
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Email verifications policies (public access for verification)
CREATE POLICY "Email verifications are publicly readable" ON email_verifications
    FOR SELECT USING (true);

CREATE POLICY "Email verifications can be created publicly" ON email_verifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Email verifications can be updated publicly" ON email_verifications
    FOR UPDATE USING (true);

-- Password resets policies (public access for password reset)
CREATE POLICY "Password resets are publicly readable" ON password_resets
    FOR SELECT USING (true);

CREATE POLICY "Password resets can be created publicly" ON password_resets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Password resets can be updated publicly" ON password_resets
    FOR UPDATE USING (true);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_approval_chains_updated_at BEFORE UPDATE ON approval_chains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_requests_updated_at BEFORE UPDATE ON funding_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo organization
INSERT INTO organizations (id, org_code, name, primary_color, secondary_color, created_at)
VALUES (
    uuid_generate_v4(),
    'DEMO',
    'Demo Organization',
    '#0EA5E9',
    '#10B981',
    NOW()
) ON CONFLICT (org_code) DO NOTHING;
