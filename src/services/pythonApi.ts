import axios from 'axios';
import { PythonApiResponse, Move } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const PYTHON_API_URL = process.env.PYTHON_API_URL!

class PythonApiService {
  private async makeRequest(endpoint: string, data?: any): Promise<any> {
    try {
      const response = await axios.post(`${PYTHON_API_URL}${endpoint}`, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }); 
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Python API error');
      }
      throw new Error('Failed to connect to Python API');
    }
  }

  async makeMove(board: string[][], player: 'X' | 'O'): Promise<PythonApiResponse> {
    return await this.makeRequest('/move', { board, player });
  }

  async checkGameState(board: string[][]): Promise<PythonApiResponse> {
    return await this.makeRequest('/game-state', { board });
  }

  async resetGame(): Promise<PythonApiResponse> {
    return await this.makeRequest('/reset');
  }

  async getComputerMove(board: string[][], player: 'X' | 'O'): Promise<Move> {
    const response = await this.makeMove(board, player);
    if (!response.move) {
      throw new Error('No move returned from Python API');
    }
    return response.move;
  }
}

export const pythonApiService = new PythonApiService(); 