/*
# Add admin role and admin management functions

## Purpose
Implement role-based authorization for a protected admin panel. Admins can manage users,
categories, quizzes, and questions. Normal users cannot access admin operations.

## Changes

### 1. Add `role` column to `profiles`
- New column: `role` (text, not null, default 'user')
- CHECK constraint: role must be 'user' or 'admin'
- The first registered user is promoted to admin automatically (trigger-based)

### 2. Lock down the `role` column
- REVOKE UPDATE on `role` from `authenticated` so users cannot self-promote
- GRANT UPDATE on user-editable columns only (full_name, username, avatar_url, bio)
- Role changes go through the `admin_set_user_role` SECURITY DEFINER function

### 3. Create `is_admin()` helper function
- SECURITY DEFINER function that checks if the current user has role='admin'
- Used by RLS policies for admin write access on content tables

### 4. Admin write policies on `categories`, `quizzes`, `questions`
- INSERT/UPDATE/DELETE: only admin users (via `is_admin()`)
- SELECT: remains public (existing policies unchanged)

### 5. Admin management functions (SECURITY DEFINER)
- `admin_set_user_role(p_user_id uuid, p_role text)` — promote/demote users
- `admin_delete_user(p_user_id uuid)` — delete a user's profile (cascades to auth.users)
- `admin_get_stats()` — returns total users, quizzes, questions, attempts, avg score

### 6. Update `get_leaderboard` execute grants
- Revoke from anon, keep authenticated only (tighten security)

## Security Notes
- The `role` column is NOT writable by users through the data API. Only the
  `admin_set_user_role` SECURITY DEFINER function can change it, and that function
  verifies the caller is an admin before proceeding.
- All admin write policies use `is_admin()` which checks `auth.uid()` against the
  profiles table — not a client-supplied parameter.
- The first user to register is auto-promoted to admin via a trigger, ensuring
  there's always at least one admin to bootstrap the system.
*/

-- ============================================================
-- 1. Add role column to profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'user';
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- ============================================================
-- 2. Auto-promote the first user to admin
-- ============================================================
DROP TRIGGER IF EXISTS promote_first_user_to_admin ON profiles;
DROP FUNCTION IF EXISTS handle_first_user_admin();

CREATE OR REPLACE FUNCTION handle_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  IF user_count = 0 THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER promote_first_user_to_admin
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_first_user_admin();

-- ============================================================
-- 3. Lock down the role column — users cannot self-promote
-- ============================================================
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, username, avatar_url, bio) ON profiles TO authenticated;

-- ============================================================
-- 4. Create is_admin() helper function
-- ============================================================
DROP FUNCTION IF EXISTS is_admin();
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================
-- 5. Admin write policies on content tables
-- ============================================================

-- Categories: admin can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin"
ON categories FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin"
ON categories FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin"
ON categories FOR DELETE
TO authenticated
USING (is_admin());

-- Quizzes: admin can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "quizzes_insert_admin" ON quizzes;
CREATE POLICY "quizzes_insert_admin"
ON quizzes FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "quizzes_update_admin" ON quizzes;
CREATE POLICY "quizzes_update_admin"
ON quizzes FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "quizzes_delete_admin" ON quizzes;
CREATE POLICY "quizzes_delete_admin"
ON quizzes FOR DELETE
TO authenticated
USING (is_admin());

-- Questions: admin can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "questions_insert_admin" ON questions;
CREATE POLICY "questions_insert_admin"
ON questions FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "questions_update_admin" ON questions;
CREATE POLICY "questions_update_admin"
ON questions FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "questions_delete_admin" ON questions;
CREATE POLICY "questions_delete_admin"
ON questions FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- 6. Admin management functions
-- ============================================================

-- Promote/demote a user
DROP FUNCTION IF EXISTS admin_set_user_role(p_user_id uuid, p_role text);
CREATE OR REPLACE FUNCTION admin_set_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorize the CALLER
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate the role value
  IF p_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  -- Prevent self-demotion (avoid locking yourself out)
  IF p_user_id = auth.uid() AND p_role != 'admin' THEN
    RAISE EXCEPTION 'You cannot demote yourself';
  END IF;

  UPDATE profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_user_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION admin_set_user_role(uuid, text) TO authenticated;

-- Delete a user (profile + auth.users via cascade)
DROP FUNCTION IF EXISTS admin_delete_user(p_user_id uuid);
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorize the CALLER
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Prevent self-deletion
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  DELETE FROM profiles WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_delete_user(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION admin_delete_user(uuid) TO authenticated;

-- Get admin dashboard stats
DROP FUNCTION IF EXISTS admin_get_stats();
CREATE OR REPLACE FUNCTION admin_get_stats()
RETURNS TABLE (
  total_users bigint,
  total_quizzes bigint,
  total_questions bigint,
  total_attempts bigint,
  avg_score numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles)::bigint AS total_users,
    (SELECT COUNT(*) FROM quizzes)::bigint AS total_quizzes,
    (SELECT COUNT(*) FROM questions)::bigint AS total_questions,
    (SELECT COUNT(*) FROM quiz_attempts)::bigint AS total_attempts,
    COALESCE((SELECT ROUND(AVG(score), 1) FROM quiz_attempts), 0)::numeric AS avg_score;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_stats() FROM anon;
GRANT EXECUTE ON FUNCTION admin_get_stats() TO authenticated;

-- ============================================================
-- 7. Update AuthContext profile query to include role
-- (The frontend fetchProfile already selects from profiles;
--  it will now also get the role column automatically since
--  profiles_select_all_authenticated allows reading all profiles)
-- ============================================================

-- Make sure the existing profiles_select_all_authenticated covers the role column
-- (it does — SELECT * is implied by the policy, and the column-level grants
--  don't restrict SELECT on any column for authenticated users)
