import { create } from 'zustand';
import { GameState, HoleData, LeaderboardEntry } from './types';

interface GameStore {
  gameState: GameState;
  timeLeft: number;
  holes: Record<string, HoleData>;
  setGameState: (state: GameState) => void;
  updateHole: (id: string, data: Partial<HoleData>) => void;
  registerHole: (data: HoleData) => void;
  resetGame: () => void;
  decrementTime: () => void;
  getLeaderboard: () => LeaderboardEntry[];
}

const INITIAL_TIME = 120; // 2 minutes

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: GameState.MENU,
  timeLeft: INITIAL_TIME,
  holes: {},
  
  setGameState: (state) => set({ gameState: state }),
  
  // Used for initial registration (Names, Colors)
  registerHole: (data) => set((state) => ({
    holes: { ...state.holes, [data.id]: data }
  })),
  
  // Used for Scoreboard updates (Low Frequency)
  updateHole: (id, data) => set((state) => {
    const current = state.holes[id];
    if (!current) return state;
    return {
      holes: {
        ...state.holes,
        [id]: { ...current, ...data }
      }
    };
  }),
  
  resetGame: () => set({
    gameState: GameState.MENU,
    timeLeft: INITIAL_TIME,
    holes: {}
  }),
  
  decrementTime: () => set((state) => {
    if (state.gameState !== GameState.PLAYING) return state;
    const newTime = state.timeLeft - 1;
    if (newTime <= 0) {
      return { timeLeft: 0, gameState: GameState.GAME_OVER };
    }
    return { timeLeft: newTime };
  }),

  getLeaderboard: () => {
    const holes = get().holes;
    return (Object.values(holes) as HoleData[])
      .sort((a, b) => b.score - a.score)
      .map(h => ({ id: h.id, name: h.name, score: Math.floor(h.score), color: h.color }));
  }
}));