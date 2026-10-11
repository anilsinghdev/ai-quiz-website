/*
# Create profiles table for user information

## Summary
Creates a `profiles` table that stores extended user information (full name, username, avatar, bio)
linked to Supabase Auth's built-in `auth.users` table. Each row corresponds to one auth user.

## New Tables
- `profiles`
  - `id` (uuid, primary key) — references `auth.users(id)`, cascading on delete
  - `email` (text, not null) — copied from auth email for convenience
  - `full_name` (text, not null) — user's display name
  - `username` (text, not null, unique) — unique handle for the user
  - `avatar_url` (text, nullable) — profile picture URL
  - `bio` (text, nullable) — short biography
  - `created_at` (timestamptz, default now()) — when the profile was created

## Security
- Row Level Security enabled on `profiles`.
- SELECT: authenticated users can read their own profile only.
- INSERT: authenticated users can insert their own profile only.
- UPDATE: authenticated users can update their own profile only.
- DELETE: authenticated users can delete their own profile only.

## Important Notes
1. The `id` column is NOT defaulted to `auth.uid()` — it is set explicitly by the client
   to match the authenticated user's `auth.users.id` on insert.
2. All four CRUD policies are separate (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated`.
3. A unique constraint on `username` prevents duplicate handles.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);
