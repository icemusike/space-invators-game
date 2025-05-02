/*
  # Create game_players table

  1. New Tables
    - `game_players`
      - `id` (uuid, primary key)
      - `game_id` (uuid, references active_games)
      - `user_id` (uuid, references auth.users)
      - `username` (text, not null)
      - `score` (integer, default 0)
      - `status` (text, default 'active')
      - `created_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `game_players` table
    - Add policy for public read access
    - Add policy for authenticated users to join games
    - Add policy for players to update their own scores
*/

CREATE TABLE IF NOT EXISTS game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES active_games NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  username text NOT NULL,
  score integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  
  -- Ensure a player can only join a game once
  UNIQUE(game_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Game players are viewable by everyone"
  ON game_players
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to join games
CREATE POLICY "Users can join games"
  ON game_players
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for players to update their own scores
CREATE POLICY "Players can update their own scores"
  ON game_players
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
