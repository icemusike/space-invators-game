import mongoose from 'mongoose';

const activeGameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: String,
    required: true
  },
  players: [{
    id: String,
    username: String
  }],
  status: {
    type: String,
    enum: ['waiting', 'ready', 'playing', 'completed'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const ActiveGame = mongoose.model('ActiveGame', activeGameSchema);
