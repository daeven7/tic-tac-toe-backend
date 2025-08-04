import { GameSession, GameState, GameStats } from '../types';
import { GameSessionModel } from '../models/GameSession';
import { UserModel } from '../models/User';
import { pythonApiService } from './pythonApi';

class GameService {
  async createGameSession(userId: string, isComputerFirst: boolean): Promise<GameSession> {
    const initialBoard = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];

    const gameSession = new GameSessionModel({
      userId,
      board: initialBoard,
      currentPlayer: 'X', // game always needs to start with X
      gameState: { isOver: false, winner: null, isDraw: false },
      isComputerFirst
    });

    const savedSession = await gameSession.save();

    if (isComputerFirst) {
      await this.makeComputerMove(savedSession._id!.toString());
    }

    return savedSession;
  }

  async getGameSession(sessionId: string, userId: string): Promise<GameSession> {
    const session = await GameSessionModel.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Game session not found');
    }
    return session;
  }

  async makePlayerMove(sessionId: string, userId: string, row: number, col: number): Promise<GameSession> {

    const session = await GameSessionModel.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Game session not found');
    }
    
    console.log("Before move - Game state:", session.gameState);
    console.log("Before move - Board:", session.board);
    
    if (session.gameState.isOver) {
      if (session.gameState.winner) {
        throw new Error(`Game is over. ${session.gameState.winner} wins! Start a new game to continue playing.`);
      } else if (session.gameState.isDraw) {
        throw new Error('Game is over. It\'s a draw! Start a new game to continue playing.');
      } else {
        throw new Error('Game is already over. Start a new game to continue playing.');
      }
    }

    if (session.board[row][col] !== '') {
      throw new Error('Invalid move: cell is already occupied');
    }

    // make player move
    session.board[row][col] = session.currentPlayer;
    
    const gameStateResponse = await pythonApiService.checkGameState(session.board);
    session.gameState = {
      isOver: gameStateResponse.game_state.is_over,
      winner: gameStateResponse.game_state.winner,
      isDraw: gameStateResponse.game_state.is_draw
    };

    await session.save();
    
    console.log("After player move - Game state:", session.gameState);
    console.log("After player move - Board:", session.board);

    if (session.gameState.isOver) {
      await this.updateGameStatistics(userId, session.gameState);
      return session;
    }

    // if game is not over make computer move
    session.currentPlayer = session.currentPlayer === 'X' ? 'O' : 'X';
    await this.makeComputerMove(sessionId);
    
    const updatedSession = await GameSessionModel.findOne({ _id: sessionId, userId });
    if (!updatedSession) {
      throw new Error('Game session not found after computer move');
    }
    
    console.log("After computer move - Game state:", updatedSession.gameState);
    console.log("After computer move - Board:", updatedSession.board);
    
    return updatedSession;
  }

  private async makeComputerMove(sessionId: string): Promise<void> {
    const session = await GameSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Game session not found');
    }
    
    console.log("Computer move - Current board:", session.board);
    console.log("Computer move - Computer symbol:", session.isComputerFirst ? 'X' : 'O');

    const computerSymbol = session.isComputerFirst ? 'X' : 'O';

    const computerMove = await pythonApiService.getComputerMove(session.board, computerSymbol);
    
    // computer move
    session.board[computerMove.row][computerMove.col] = computerSymbol;
    
    const gameStateResponse = await pythonApiService.checkGameState(session.board);
    session.gameState = {
      isOver: gameStateResponse.game_state.is_over,
      winner: gameStateResponse.game_state.winner,
      isDraw: gameStateResponse.game_state.is_draw
    };

    // switch player back to user
    session.currentPlayer = session.isComputerFirst ? 'O' : 'X';

    await session.save();
    
    console.log("Computer move - After save - Board:", session.board);
    console.log("Computer move - After save - Game state:", session.gameState);

    if (session.gameState.isOver) {
      await this.updateGameStatistics(session.userId.toString(), session.gameState);
    }
  }

  private async updateGameStatistics(userId: string, gameState: GameState): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) return;

    if (gameState.isDraw) {
      user.stats.draws += 1;
    } else if (gameState.winner) {

      const gameSession = await GameSessionModel.findOne({ userId }).sort({ createdAt: -1 });
      if (gameSession) {
        const userSymbol = gameSession.isComputerFirst ? 'O' : 'X';
        if (gameState.winner === userSymbol) {
          user.stats.wins += 1;
        } else {
          user.stats.losses += 1;
        }
      }
    }

    await user.save();
  }

  async getUserStats(userId: string): Promise<GameStats> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.stats;
  }

  async getActiveGameSession(userId: string): Promise<GameSession | null> {
    const mostRecentGame = await GameSessionModel.findOne({ 
      userId
    }).sort({ createdAt: -1 });

    if (!mostRecentGame) {
      console.log(`No game sessions found for user ${userId}`);
      return null;
    }

    if (mostRecentGame.gameState.isOver) {
      console.log(`No active game session.`);
      return null;
    }

    return mostRecentGame;
  }

}

export const gameService = new GameService(); 