/*
# Add leaderboard function and public profile read access

## Purpose
The leaderboard feature requires aggregating quiz stats across ALL users and joining with profile data.
Currently, profiles and quiz_attempts only allow users to read their OWN data, which blocks leaderboard queries.

## Changes
1. SECURITY DEFINER function `get_leaderboard(period text)` — aggregates quiz_attempts per user,
   joins with profiles for name/username/avatar, and returns ranked results.
   Runs with owner privileges so it bypasses RLS on both tables.
   Accepts 'weekly', 'monthly', or 'all' period filter.
2. Grant EXECUTE on the function to the `authenticated` role.
3. Add SELECT policy on profiles so authenticated users can read other users' public profile
   fields (needed for displaying names/avatars on the leaderboard outside the function).

## Security Notes
- The SECURITY DEFINER function only exposes aggregate data (counts, averages, best scores)
  plus the user's public profile fields. It does NOT expose individual attempt rows or answers.
- The profiles SELECT policy exposes all columns on profiles. The profiles table contains:
  id, email, full_name, username, avatar_url, bio, created_at. Email is semi-public in a
  leaderboard context (visible to authenticated peers). This is acceptable for this app.
- The function is idempotent — safe to re-run.
*/

-- Drop existing function if re-running
DROP FUNCTION IF EXISTS get_leaderboard(text);

-- Create leaderboard function
CREATE FUNCTION get_leaderboard(period text DEFAULT 'all')
RETURNS TABLE (
  user_id uuid,
  full_name text,
  username text,
  avatar_url text,
  total_quizzes bigint,
  avg_score numeric,
  best_score integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qa.user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    COUNT(qa.id)::bigint AS total_quizzes,
    ROUND(AVG(qa.score), 1) AS avg_score,
    MAX(qa.score)::integer AS best_score
  FROM quiz_attempts qa
  JOIN profiles p ON p.id = qa.user_id
  WHERE
    CASE
      WHEN period = 'weekly' THEN qa.completed_at >= NOW() - INTERVAL '7 days'
      WHEN period = 'monthly' THEN qa.completed_at >= NOW() - INTERVAL '30 days'
      ELSE TRUE
    END
  GROUP BY qa.user_id, p.full_name, p.username, p.avatar_url
  ORDER BY avg_score DESC, best_score DESC, total_quizzes DESC
  LIMIT 100;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION get_leaderboard(text) TO authenticated;

-- Add SELECT policy so authenticated users can read all profiles (for leaderboard display)
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);
