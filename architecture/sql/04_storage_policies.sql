-- ============================================
-- STEP 2.2: STORAGE BUCKET POLICIES
-- Run this after creating buckets in Supabase UI
-- ============================================

-- =====================================
-- CHECKIN-PHOTOS BUCKET POLICIES
-- =====================================

-- Allow authenticated users to upload to their own folder
-- Path format: {experience_id}/{whop_id}/{filename}
CREATE POLICY "Users can upload own checkin photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'checkin-photos'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
    AND (storage.foldername(name))[2] = (current_setting('request.jwt.claims', true)::json->>'whop_id')
);

-- Allow users to read their own photos
CREATE POLICY "Users can read own checkin photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'checkin-photos'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
    AND (storage.foldername(name))[2] = (current_setting('request.jwt.claims', true)::json->>'whop_id')
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own checkin photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'checkin-photos'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
    AND (storage.foldername(name))[2] = (current_setting('request.jwt.claims', true)::json->>'whop_id')
);

-- Allow community members to read public photos (for feed)
-- Note: This allows any authenticated user in the same experience to read
CREATE POLICY "Community can read public checkin photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'checkin-photos'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
);

-- =====================================
-- AVATARS BUCKET POLICIES
-- =====================================

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
    AND (storage.foldername(name))[2] = (current_setting('request.jwt.claims', true)::json->>'whop_id')
);

-- Allow users to read their own avatar
CREATE POLICY "Users can read own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
    AND (storage.foldername(name))[2] = (current_setting('request.jwt.claims', true)::json->>'whop_id')
);

-- Allow users to update (replace) their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
    AND (storage.foldername(name))[2] = (current_setting('request.jwt.claims', true)::json->>'whop_id')
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
    AND (storage.foldername(name))[2] = (current_setting('request.jwt.claims', true)::json->>'whop_id')
);

-- Allow all community members to read any avatar (for feed/profiles)
CREATE POLICY "Community can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json->>'experience_id')
);
