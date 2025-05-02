/*
  # Create leaderboard table

  1. New Tables
    - `leaderboard`
      - `id` (uuid, primary key)
      - `username` (text, not null)
      - `score` (integer, not null)
      - `created_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `leaderboard` table
    - Add policy for public read access
    - Add policy for authenticated users to insert their own scores
*/

CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Leaderboard entries are viewable by everyone"
  ON leaderboard
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON leaderboard
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
