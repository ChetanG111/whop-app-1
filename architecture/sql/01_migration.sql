-- ============================================
-- STEP 1.3: MIGRATION SCRIPT
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- =====================================
-- ENUMS
-- =====================================

CREATE TYPE user_role AS ENUM ('member', 'admin');
CREATE TYPE checkin_type AS ENUM ('workout', 'rest', 'reflect');
CREATE TYPE workout_type AS ENUM ('push', 'pull', 'legs', 'upper', 'full_body', 'cardio', 'custom');
CREATE TYPE reflect_reason AS ENUM ('sick', 'injury', 'travel', 'work', 'family', 'mental_health', 'other');

-- =====================================
-- TABLES
-- =====================================

-- Users table (unique per community)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whop_id TEXT NOT NULL,
    whop_experience_id TEXT NOT NULL,
    role user_role DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Same user can exist in multiple communities
    CONSTRAINT unique_user_per_community UNIQUE(whop_id, whop_experience_id)
);

CREATE INDEX idx_users_whop_lookup ON users(whop_id, whop_experience_id);
CREATE INDEX idx_users_experience ON users(whop_experience_id);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'User',
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    is_dark_mode BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Check-ins table
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type checkin_type NOT NULL,
    workout_type workout_type,
    reflect_reason reflect_reason,
    rest_reason TEXT,
    note TEXT DEFAULT '',
    is_note_public BOOLEAN DEFAULT false,
    photo_url TEXT,
    is_photo_public BOOLEAN DEFAULT false,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- One check-in per user per day
    CONSTRAINT unique_user_checkin_per_day UNIQUE(user_id, checkin_date)
);

CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_user_date ON checkins(user_id, checkin_date DESC);
CREATE INDEX idx_checkins_public_feed ON checkins(checkin_date DESC) 
    WHERE is_note_public = true OR is_photo_public = true;

-- User streaks table
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_checkin_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);

-- =====================================
-- TRIGGERS
-- =====================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile and streak records when user is created
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id) VALUES (NEW.id);
    INSERT INTO user_streaks (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_defaults();
