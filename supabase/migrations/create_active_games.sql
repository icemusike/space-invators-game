/*
  # Create active_games table

  1. New Tables
    - `active_games`
      - `id` (uuid, primary key)
      - `host_id` (uuid, references auth.users)
      - `host_username` (text, not null)
      - `status` (text, not null)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `active_games` table
    - Add policy for public read access
    - Add policy for authenticated users to create and update their own games
*/

CREATE TABLE IF NOT EXISTS active_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES auth.users NOT NULL,
  host_username text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE active_games ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Active games are viewable by everyone"
  ON active_games
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to create their own games
CREATE POLICY "Users can create their own games"
  ON active_games
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

-- Create policy for hosts to update their own games
CREATE POLICY "Hosts can update their own games"
  ON active_games
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

-- Create policy for hosts to delete their own games
CREATE POLICY "Hosts can delete their own games"
  ON active_games
  FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);
