import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, JwtPayload } from '../types';
import { UserModel } from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

class AuthService {
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '5m' });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async register(email: string, password: string): Promise<User> {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = new UserModel({
      email,
      password: hashedPassword
    });

    return await user.save();
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user._id!.toString(),
      email: user.email
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.verifyRefreshToken(token);
    
    const user = await UserModel.findById(payload.userId);
    if (!user || user.refreshToken !== token) {
      throw new Error('Invalid refresh token');
    }

    const newPayload: JwtPayload = {
      userId: user._id!.toString(),
      email: user.email
    };

    const accessToken = this.generateAccessToken(newPayload);
    const refreshToken = this.generateRefreshToken(newPayload);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { refreshToken: null });
  }
}

export const authService = new AuthService(); 