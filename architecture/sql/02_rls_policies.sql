-- ============================================
-- STEP 1.4: ROW LEVEL SECURITY POLICIES
-- Run this SECOND in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- =====================================
-- HELPER FUNCTION: Get current user's info from JWT
-- =====================================

CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE (user_id UUID, whop_id TEXT, experience_id TEXT, role user_role) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.whop_id, u.whop_experience_id, u.role
    FROM users u
    WHERE u.whop_id = current_setting('request.jwt.claims', true)::json->>'whop_id'
      AND u.whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- USERS POLICIES
-- =====================================

-- Users can read their own data
CREATE POLICY "Users can read own data"
    ON users FOR SELECT
    USING (
        whop_id = current_setting('request.jwt.claims', true)::json->>'whop_id'
        AND whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
    );

-- Admins can read all users in their community
CREATE POLICY "Admins can read community users"
    ON users FOR SELECT
    USING (
        whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE whop_id = current_setting('request.jwt.claims', true)::json->>'whop_id'
            AND whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
            AND role = 'admin'
        )
    );

-- =====================================
-- USER_PROFILES POLICIES
-- =====================================

-- Users can manage their own profile
CREATE POLICY "Users can manage own profile"
    ON user_profiles FOR ALL
    USING (
        user_id = (SELECT user_id FROM get_current_user_info() LIMIT 1)
    );

-- All authenticated users can read profiles in their community
CREATE POLICY "Community can read profiles"
    ON user_profiles FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
        )
    );

-- =====================================
-- CHECKINS POLICIES
-- =====================================

-- Users can manage their own check-ins
CREATE POLICY "Users can manage own checkins"
    ON checkins FOR ALL
    USING (
        user_id = (SELECT user_id FROM get_current_user_info() LIMIT 1)
    );

-- Anyone in community can read public check-ins
CREATE POLICY "Public checkins are readable"
    ON checkins FOR SELECT
    USING (
        (is_note_public = true OR is_photo_public = true)
        AND user_id IN (
            SELECT id FROM users 
            WHERE whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
        )
    );

-- Admins can read all check-ins in their community
CREATE POLICY "Admins can read all community checkins"
    ON checkins FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
        )
        AND EXISTS (
            SELECT 1 FROM get_current_user_info() WHERE role = 'admin'
        )
    );

-- Admins can DELETE any check-in in their community
CREATE POLICY "Admins can delete any community checkin"
    ON checkins FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
        )
        AND EXISTS (
            SELECT 1 FROM get_current_user_info() WHERE role = 'admin'
        )
    );

-- =====================================
-- USER_STREAKS POLICIES
-- =====================================

-- Users can read their own streak
CREATE POLICY "Users can read own streak"
    ON user_streaks FOR SELECT
    USING (
        user_id = (SELECT user_id FROM get_current_user_info() LIMIT 1)
    );

-- Admins can read all streaks in their community
CREATE POLICY "Admins can read community streaks"
    ON user_streaks FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_experience_id = current_setting('request.jwt.claims', true)::json->>'experience_id'
        )
        AND EXISTS (
            SELECT 1 FROM get_current_user_info() WHERE role = 'admin'
        )
    );
