import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

export const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
