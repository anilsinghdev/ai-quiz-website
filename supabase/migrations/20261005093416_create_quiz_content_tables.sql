/*
# Create quiz content tables: categories, quizzes, questions

## Summary
Creates the core quiz content schema: categories, quizzes, and questions.
Categories hold subjects (Python, Java, etc.). Quizzes belong to a category.
Questions belong to a quiz and store multiple-choice options as JSONB.

## New Tables

### categories
- `id` (uuid, PK) — unique category identifier
- `slug` (text, unique, not null) — URL-safe identifier (e.g. "python")
- `name` (text, not null) — display name (e.g. "Python")
- `description` (text, not null) — short description
- `icon_name` (text, not null) — lucide icon name for frontend rendering
- `color` (text, not null) — tailwind gradient classes for styling
- `sort_order` (int, default 0) — display ordering
- `created_at` (timestamptz, default now())

### quizzes
- `id` (uuid, PK)
- `category_id` (uuid, FK → categories.id ON DELETE CASCADE)
- `title` (text, not null)
- `description` (text, not null)
- `difficulty` (text, not null, check in 'Easy','Medium','Hard')
- `created_at` (timestamptz, default now())

### questions
- `id` (uuid, PK)
- `quiz_id` (uuid, FK → quizzes.id ON DELETE CASCADE)
- `question_text` (text, not null)
- `options` (jsonb, not null) — array of option strings
- `correct_answer` (int, not null) — 0-based index into options
- `explanation` (text, not null)
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on all three tables.
- categories, quizzes, questions: publicly readable (TO anon, authenticated) since quiz content is shared.
  No INSERT/UPDATE/DELETE policies — content is managed server-side only.
- Indexes on foreign keys for query performance.

## Important Notes
1. These are content tables — no user_id, no ownership checks. Read-only from the frontend.
2. Cascade deletes: deleting a category removes its quizzes; deleting a quiz removes its questions.
3. options stored as JSONB array, e.g. ["Option A", "Option B", "Option C", "Option D"].
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL,
  color text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer int NOT NULL,
  explanation text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_category_id ON quizzes(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read"
ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "quizzes_public_read" ON quizzes;
CREATE POLICY "quizzes_public_read"
ON quizzes FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "questions_public_read" ON questions;
CREATE POLICY "questions_public_read"
ON questions FOR SELECT
TO anon, authenticated USING (true);
