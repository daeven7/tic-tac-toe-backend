import mongoose, { Schema, Document } from 'mongoose';
import { GameSession, GameState } from '../types';

const gameStateSchema = new Schema<GameState>({
  isOver: { type: Boolean, default: false },
  winner: { type: String, enum: ['X', 'O', null], default: null },
  isDraw: { type: Boolean, default: false }
});

const gameSessionSchema = new Schema<GameSession>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  board: { 
    type: [[String]], 
    default: [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]
  },
  currentPlayer: { 
    type: String, 
    enum: ['X', 'O'], 
    default: 'X' 
  },
  gameState: { 
    type: gameStateSchema, 
    default: () => ({ isOver: false, winner: null, isDraw: false })
  },
  isComputerFirst: { 
    type: Boolean, 
    required: true 
  }
}, {
  timestamps: true
});

export const GameSessionModel = mongoose.model<GameSession>('GameSession', gameSessionSchema); 