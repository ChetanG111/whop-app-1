-- ============================================
-- STEP 1.5: DATABASE FUNCTIONS
-- Run this THIRD in Supabase SQL Editor
-- ============================================

-- =====================================
-- FUNCTION: Update user streak after check-in
-- =====================================

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Get current streak data
    SELECT last_checkin_date, current_streak, longest_streak
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM user_streaks
    WHERE user_id = p_user_id;
    
    -- Calculate new streak
    IF v_last_date IS NULL THEN
        -- First ever check-in
        v_current_streak := 1;
    ELSIF v_last_date = v_today THEN
        -- Already checked in today, no change
        RETURN;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
        -- Consecutive day
        v_current_streak := v_current_streak + 1;
    ELSE
        -- Streak broken
        v_current_streak := 1;
    END IF;
    
    -- Update longest streak if current exceeds it
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;
    
    -- Save updated streak
    UPDATE user_streaks
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_checkin_date = v_today,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- FUNCTION: Get or create user by Whop ID
-- =====================================

CREATE OR REPLACE FUNCTION get_or_create_user(
    p_whop_id TEXT,
    p_whop_experience_id TEXT
)
RETURNS TABLE (
    id UUID,
    whop_id TEXT,
    whop_experience_id TEXT,
    role user_role,
    is_new BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_is_new BOOLEAN := false;
BEGIN
    -- Try to find existing user
    SELECT u.id INTO v_user_id
    FROM users u
    WHERE u.whop_id = p_whop_id 
      AND u.whop_experience_id = p_whop_experience_id;
    
    -- Create if not exists
    IF v_user_id IS NULL THEN
        INSERT INTO users (whop_id, whop_experience_id)
        VALUES (p_whop_id, p_whop_experience_id)
        RETURNING users.id INTO v_user_id;
        v_is_new := true;
    ELSE
        -- Update last seen
        UPDATE users SET updated_at = now() WHERE users.id = v_user_id;
    END IF;
    
    RETURN QUERY
    SELECT u.id, u.whop_id, u.whop_experience_id, u.role, v_is_new
    FROM users u
    WHERE u.id = v_user_id;
END;
$$ LANGUAGE plpgsql;
