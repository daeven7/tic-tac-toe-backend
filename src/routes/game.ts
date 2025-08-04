import { Router, Request, Response } from 'express';
import { gameService } from '../services/gameService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { StartGameRequest, GameMoveRequest } from '../types';

const router = Router();

router.use(authenticateToken);

router.post('/start', async (req: AuthRequest & Request<{}, {}, StartGameRequest>, res: Response) => {
  try {
    const { isComputerFirst } = req.body;
    const userId = req.user!.userId;
    
    const gameSession = await gameService.createGameSession(userId, isComputerFirst);
    
    res.json({
      message: 'Game started successfully',
      gameSession: {
        id: gameSession._id,
        board: gameSession.board,
        currentPlayer: gameSession.currentPlayer,
        gameState: gameSession.gameState,
        isComputerFirst: gameSession.isComputerFirst
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/current', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const gameSession = await gameService.getActiveGameSession(userId);
    
    if (!gameSession) {
      return res.status(404).json({ error: 'No active game session found' });
    }
    
    res.json({
      gameSession: {
        id: gameSession._id,
        board: gameSession.board,
        currentPlayer: gameSession.currentPlayer,
        gameState: gameSession.gameState,
        isComputerFirst: gameSession.isComputerFirst
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/move', async (req: AuthRequest & Request<{}, {}, GameMoveRequest>, res: Response) => {
  try {
    const { row, col } = req.body;
    const userId = req.user!.userId;
    
    const currentSession = await gameService.getActiveGameSession(userId);
    if (!currentSession) {
      return res.status(404).json({ error: 'No active game session found. Please start a new game.' });
    }
    
    const updatedSession = await gameService.makePlayerMove(currentSession._id!.toString(), userId, row, col);
    
    res.json({
      message: 'Move made successfully',
      gameSession: {
        id: updatedSession._id,
        board: updatedSession.board,
        currentPlayer: updatedSession.currentPlayer,
        gameState: updatedSession.gameState,
        isComputerFirst: updatedSession.isComputerFirst
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const stats = await gameService.getUserStats(userId);
    
    res.json({
      stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// router.post('/reset', async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user!.userId;
//     const { isComputerFirst } = req.body;
    
//     await gameService.endCurrentGameSession(userId);
    
//     const gameSession = await gameService.createGameSession(userId, isComputerFirst);
    
//     res.json({
//       message: 'Game reset successfully',
//       gameSession: {
//         id: gameSession._id,
//         board: gameSession.board,
//         currentPlayer: gameSession.currentPlayer,
//         gameState: gameSession.gameState,
//         isComputerFirst: gameSession.isComputerFirst
//       }
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

export default router; 