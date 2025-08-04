export interface User {
  _id?: string;
  email: string;
  password: string;
  stats: GameStats;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
}

export interface GameSession {
  _id?: string;
  userId: string | any; 
  board: string[][];
  currentPlayer: 'X' | 'O';
  gameState: GameState;
  isComputerFirst: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GameState {
  isOver: boolean;
  winner: 'X' | 'O' | null;
  isDraw: boolean;
}

export interface Move {
  row: number;
  col: number;
}

export interface PythonApiResponse {
  move?: Move;
  board: string[][];
  game_state: {
    is_over: boolean;
    winner: 'X' | 'O' | null;
    is_draw: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface GameMoveRequest {
  row: number;
  col: number;
}

export interface StartGameRequest {
  isComputerFirst: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
} 