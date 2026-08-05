/*
# Create quiz_state table (single-tenant, no auth)

1. New Tables
- `quiz_state`
  - `id` (int, primary key, fixed to 1) — a single shared row for the whole competition
  - `data` (jsonb) — the full competition state: groups, questions, settings, competition meta
  - `updated_at` (timestamptz) — last write time
2. Security
- Enable RLS on `quiz_state`.
- Allow anon + authenticated full CRUD because the data is intentionally shared/public
  (this is a presentation scoreboard meant to be viewed and driven from any device).
3. Notes
- The app always reads/writes the row with id = 1.
- A seed row with id = 1 and a default empty state is inserted so the app never sees a missing row.
*/

CREATE TABLE IF NOT EXISTS quiz_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quiz_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_quiz_state" ON quiz_state;
CREATE POLICY "anon_select_quiz_state" ON quiz_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_quiz_state" ON quiz_state;
CREATE POLICY "anon_insert_quiz_state" ON quiz_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_quiz_state" ON quiz_state;
CREATE POLICY "anon_update_quiz_state" ON quiz_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_quiz_state" ON quiz_state;
CREATE POLICY "anon_delete_quiz_state" ON quiz_state FOR DELETE
  TO anon, authenticated USING (true);

-- Seed the single shared row if it does not exist.
INSERT INTO quiz_state (id, data)
SELECT 1, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM quiz_state WHERE id = 1);
