-- ============================================
-- STEP: DATABASE INDEX OPTIMIZATION
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- =====================================
-- INDEX 1: Public Feed Query Optimization
-- =====================================
-- Supports: getPublicFeed() in lib/db/checkins.ts
-- Query pattern: 
--   SELECT * FROM checkins
--   WHERE user_id IN (...) AND (is_note_public = true OR is_photo_public = true)
--   ORDER BY created_at DESC LIMIT 50;
--
-- Why: The existing idx_checkins_public_feed uses checkin_date DESC,
-- but this query orders by created_at DESC and filters by user_id.

CREATE INDEX IF NOT EXISTS idx_checkins_user_public_created 
    ON checkins(user_id, created_at DESC) 
    WHERE is_note_public = true OR is_photo_public = true;

-- =====================================
-- INDEX 2: Leaderboard Sorting (Optional)
-- =====================================
-- Supports: getStreakLeaderboard() in lib/db/streaks.ts
-- Query pattern:
--   SELECT * FROM users u
--   LEFT JOIN user_streaks us ON ...
--   WHERE u.whop_experience_id = $1
--   ORDER BY us.current_streak DESC LIMIT 10;
--
-- Why: Improves sorting performance for communities with 100+ members.

CREATE INDEX IF NOT EXISTS idx_user_streaks_current_streak 
    ON user_streaks(current_streak DESC);

-- =====================================
-- VERIFICATION (run after creating indexes)
-- =====================================
-- Uncomment and run to verify index creation:
--
-- SELECT tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND indexname IN (
--     'idx_checkins_user_public_created', 
--     'idx_user_streaks_current_streak'
--   );
