export enum Direction {
  NONE = 'NONE',
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum GhostName {
  BLINKY = 'BLINKY', // Red
  PINKY = 'PINKY',   // Pink
  INKY = 'INKY',     // Cyan
  CLYDE = 'CLYDE',   // Orange
}

export enum GhostMode {
  CHASE = 'CHASE',
  SCATTER = 'SCATTER',
  FRIGHTENED = 'FRIGHTENED',
  EATEN = 'EATEN',
}

export enum GameState {
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  PACMAN_DYING = 'PACMAN_DYING',
  LEVEL_CLEARED = 'LEVEL_CLEARED',
  GAME_OVER = 'GAME_OVER',
}

export enum GameSpeedPreset {
  SLOW = 'SLOW',
  NORMAL = 'NORMAL',
  FAST = 'FAST',
}

export interface Position {
  x: number;
  y: number;
}

export interface TileCoord {
  col: number;
  row: number;
}

export interface PacmanEntity {
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  mouthAngle: number;
  mouthDir: number; // 1 for opening, -1 for closing
  speed: number;
  deathFrame: number;
}

export interface GhostEntity {
  name: GhostName;
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  mode: GhostMode;
  target: TileCoord;
  speed: number;
  inHouse: boolean;
  houseTimer: number;
  frightenedTimer: number;
  color: string;
  scatterCorner: TileCoord;
  lastDecisionCol?: number;
  lastDecisionRow?: number;
}

export interface FruitItem {
  name: string;
  points: number;
  symbol: string;
  color: string;
  col: number;
  row: number;
  active: boolean;
  timer: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}
