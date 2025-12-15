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
    v_row_exists BOOLEAN;
BEGIN
    -- Check if streak row exists and get current data
    SELECT last_checkin_date, current_streak, longest_streak, TRUE
    INTO v_last_date, v_current_streak, v_longest_streak, v_row_exists
    FROM user_streaks
    WHERE user_id = p_user_id;
    
    -- Default values if row doesn't exist
    IF v_row_exists IS NULL THEN
        v_current_streak := 0;
        v_longest_streak := 0;
        v_last_date := NULL;
    END IF;
    
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
    
    -- UPSERT: Insert if not exists, update if exists
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_checkin_date, updated_at)
    VALUES (p_user_id, v_current_streak, v_longest_streak, v_today, now())
    ON CONFLICT (user_id) DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_checkin_date = EXCLUDED.last_checkin_date,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- FUNCTION: Recalculate user streak from all check-ins
-- Use this after deleting a check-in
-- =====================================

CREATE OR REPLACE FUNCTION recalculate_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_last_date DATE := NULL;
    v_prev_date DATE := NULL;
    v_running_streak INTEGER := 0;
    v_max_streak INTEGER := 0;
    v_today DATE := CURRENT_DATE;
    v_is_active_streak BOOLEAN := FALSE;
    checkin_record RECORD;
BEGIN
    -- Loop through ALL check-ins in descending date order to find:
    -- 1. Current active streak (from today/yesterday backwards)
    -- 2. Longest streak ever (by scanning all consecutive sequences)
    FOR checkin_record IN
        SELECT DISTINCT checkin_date
        FROM checkins
        WHERE user_id = p_user_id
        ORDER BY checkin_date DESC
    LOOP
        IF v_last_date IS NULL THEN
            -- First record (most recent)
            v_last_date := checkin_record.checkin_date;
            v_prev_date := checkin_record.checkin_date;
            v_running_streak := 1;
            
            -- Check if streak is still active (today or yesterday)
            IF checkin_record.checkin_date = v_today OR checkin_record.checkin_date = v_today - INTERVAL '1 day' THEN
                v_is_active_streak := TRUE;
            END IF;
        ELSE
            -- Check if consecutive with previous
            IF v_prev_date - INTERVAL '1 day' = checkin_record.checkin_date THEN
                v_running_streak := v_running_streak + 1;
                v_prev_date := checkin_record.checkin_date;
            ELSE
                -- Gap found, this streak ends
                -- Save current streak if it's the longest so far
                IF v_running_streak > v_max_streak THEN
                    v_max_streak := v_running_streak;
                END IF;
                -- If this was the active streak, save it
                IF v_is_active_streak THEN
                    v_current_streak := v_running_streak;
                    v_is_active_streak := FALSE; -- No longer tracking active streak
                END IF;
                -- Start a new streak count from this record
                v_running_streak := 1;
                v_prev_date := checkin_record.checkin_date;
            END IF;
        END IF;
    END LOOP;
    
    -- After loop, check the final running streak
    IF v_running_streak > v_max_streak THEN
        v_max_streak := v_running_streak;
    END IF;
    
    -- If we were still tracking the active streak, set it
    IF v_is_active_streak THEN
        v_current_streak := v_running_streak;
    END IF;
    
    v_longest_streak := v_max_streak;
    
    -- UPSERT the streak data (recalculated from scratch)
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_checkin_date, updated_at)
    VALUES (p_user_id, v_current_streak, v_longest_streak, v_last_date, now())
    ON CONFLICT (user_id) DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_checkin_date = EXCLUDED.last_checkin_date,
        updated_at = now();
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
