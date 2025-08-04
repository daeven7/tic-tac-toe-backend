import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { LoginRequest, RegisterRequest } from '../types';

const router = Router();

router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, email: user.email }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    
    res.json({
      message: 'Login successful',
      user: { id: user._id, email: user.email },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);
    
    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await authService.logout(req.user!.userId);
    res.json({ message: 'Logout successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 