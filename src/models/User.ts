import mongoose, { Schema, Document } from 'mongoose';
import { User, GameStats } from '../types';

const gameStatsSchema = new Schema<GameStats>({
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 }
});

const userSchema = new Schema<User>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  stats: { 
    type: gameStatsSchema, 
    default: () => ({ wins: 0, losses: 0, draws: 0 })
  },
  refreshToken: { 
    type: String 
  }
}, {
  timestamps: true
});

export const UserModel = mongoose.model<User>('User', userSchema); 