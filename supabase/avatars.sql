-- ============================================================================
-- BioVerseAR — Explorer avatars (step 1): store each student's chosen avatar.
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- The avatar is just a short id (e.g. 'kid-goggles') that maps to an inline SVG
-- character in the app — no image is ever uploaded. The picker already works
-- on-device without this; running it lets a student's avatar sync to the cloud
-- (so it follows them to another device) and prepares the leaderboard/roster.
-- ============================================================================

alter table public.profiles add column if not exists avatar text;

-- Step 2 (showing avatars on the leaderboard and teacher roster) will add avatar
-- to get_leaderboard / get_scores / get_class_roster in a follow-up migration.
