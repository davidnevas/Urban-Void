import { Vector3 } from 'three';

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum PropType {
  CRATE = 'CRATE',
  BARREL = 'BARREL',
  TREE = 'TREE',
  CAR = 'CAR',
  BUILDING = 'BUILDING',
  LAMP = 'LAMP'
}

export interface PropConfig {
  id: string;
  type: PropType;
  position: [number, number, number];
  value: number; // Score value / growth amount
  size: number; // Radius/Bounding box for consumption check
  color: string;
}

export interface HoleData {
  id: string;
  position: [number, number, number];
  radius: number;
  score: number;
  isPlayer: boolean;
  name: string;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  color: string;
}