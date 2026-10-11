/*
# Create quiz_attempts and answers tables

## Summary
Creates user-attempt tracking: quiz_attempts records each quiz session a user
takes, and answers records the user's response to each question within that attempt.

## New Tables

### quiz_attempts
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL, DEFAULT auth.uid(), FK → auth.users(id) ON DELETE CASCADE)
- `quiz_id` (uuid, NOT NULL, FK → quizzes(id) ON DELETE CASCADE)
- `category_id` (uuid, NOT NULL, FK → categories(id) ON DELETE CASCADE) — denormalized for quick dashboard queries
- `score` (int, NOT NULL, default 0) — percentage score (0-100)
- `total_questions` (int, NOT NULL)
- `correct_answers` (int, NOT NULL)
- `time_spent_seconds` (int, NOT NULL, default 0)
- `difficulty` (text, NOT NULL) — difficulty level at time of attempt
- `started_at` (timestamptz, default now())
- `completed_at` (timestamptz, default now())

### answers
- `id` (uuid, PK)
- `attempt_id` (uuid, NOT NULL, FK → quiz_attempts(id) ON DELETE CASCADE)
- `question_id` (uuid, NOT NULL, FK → questions(id) ON DELETE CASCADE)
- `selected_answer` (int) — 0-based index, null if unanswered
- `is_correct` (boolean, NOT NULL, default false)
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on both tables.
- quiz_attempts: owner-scoped CRUD (user can only see/manage their own attempts).
- answers: scoped through the parent attempt's ownership — a user can only
  read/insert answers for attempts they own.
- user_id defaults to auth.uid() so inserts from the client work without passing it.

## Important Notes
1. user_id has DEFAULT auth.uid() — the client can insert without specifying it.
2. answers ownership is checked via EXISTS subquery against quiz_attempts.user_id.
3. Cascade deletes: deleting an attempt removes its answers; deleting a question
   removes its answers; deleting a user removes their attempts.
4. category_id is denormalized on quiz_attempts so the dashboard can show category
   breakdowns without joining back through quizzes → categories.
*/

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  total_questions int NOT NULL,
  correct_answers int NOT NULL,
  time_spent_seconds int NOT NULL DEFAULT 0,
  difficulty text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer int,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_category_id ON quiz_attempts(category_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- quiz_attempts: owner-scoped CRUD
DROP POLICY IF EXISTS "attempts_select_own" ON quiz_attempts;
CREATE POLICY "attempts_select_own"
ON quiz_attempts FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "attempts_insert_own" ON quiz_attempts;
CREATE POLICY "attempts_insert_own"
ON quiz_attempts FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attempts_update_own" ON quiz_attempts;
CREATE POLICY "attempts_update_own"
ON quiz_attempts FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attempts_delete_own" ON quiz_attempts;
CREATE POLICY "attempts_delete_own"
ON quiz_attempts FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- answers: scoped through parent attempt ownership
DROP POLICY IF EXISTS "answers_select_own" ON answers;
CREATE POLICY "answers_select_own"
ON answers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = answers.attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "answers_insert_own" ON answers;
CREATE POLICY "answers_insert_own"
ON answers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = answers.attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "answers_update_own" ON answers;
CREATE POLICY "answers_update_own"
ON answers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = answers.attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = answers.attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "answers_delete_own" ON answers;
CREATE POLICY "answers_delete_own"
ON answers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = answers.attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
);
