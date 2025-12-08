-- Initial Database Schema for YCD Farmer Guide

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('farmer', 'expert', 'buyer', 'admin', 'general')) NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    region VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'fr',
    created_by_admin_id UUID REFERENCES users(id),
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_at TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Farmers Table
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    farm_name VARCHAR(200),
    farm_size_hectares DECIMAL(8, 2),
    farm_location_lat DECIMAL(10, 8),
    farm_location_lng DECIMAL(11, 8),
    crops_grown TEXT[], 
    farming_experience_years INT,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    offline_data_sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_farmer_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Experts Table
CREATE TABLE experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specializations TEXT[] NOT NULL,
    hourly_rate_fcfa DECIMAL(10, 2) NOT NULL,
    ycd_commission_rate DECIMAL(5, 4) DEFAULT 0.20,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_consultations INT DEFAULT 0,
    total_revenue_fcfa DECIMAL(12, 2) DEFAULT 0,
    certification_documents TEXT[],
    bio TEXT,
    available_languages TEXT[],
    is_available BOOLEAN DEFAULT true,
    profile_visible BOOLEAN DEFAULT true,
    created_by_admin_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expert_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create YCD Admins Table
CREATE TABLE ycd_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    admin_level VARCHAR(20) DEFAULT 'standard',
    permissions TEXT[],
    assigned_regions TEXT[],
    can_create_experts BOOLEAN DEFAULT true,
    can_approve_payments BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_role VARCHAR(20),
    action_type VARCHAR(50) NOT NULL,
    table_affected VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add more tables from the schema as needed...