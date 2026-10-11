import { GameSpeedPreset, TileCoord } from '../types';

export const TILE_SIZE = 18; // 18px per tile => 28 * 18 = 504px width, 31 * 18 = 558px height
export const MAP_COLS = 28;
export const MAP_ROWS = 31;

export const SPEED_PRESETS: Record<
  GameSpeedPreset,
  {
    label: string;
    pacmanSpeed: number;
    ghostSpeed: number;
    description: string;
  }
> = {
  [GameSpeedPreset.SLOW]: {
    label: 'Slow',
    pacmanSpeed: 0.055,
    ghostSpeed: 0.048,
    description: 'Casual, relaxed pace with smooth steering',
  },
  [GameSpeedPreset.NORMAL]: {
    label: 'Normal',
    pacmanSpeed: 0.075,
    ghostSpeed: 0.066,
    description: 'Balanced classic arcade experience',
  },
  [GameSpeedPreset.FAST]: {
    label: 'Fast',
    pacmanSpeed: 0.098,
    ghostSpeed: 0.088,
    description: 'Turbo arcade speed',
  },
};

// Classic Pac-Man tile legend:
// '#' : Wall
// '.' : Normal pellet (10 pts)
// 'o' : Energizer / Power pellet (50 pts)
// ' ' : Empty corridor / walkable
// '-' : Ghost house gate (walkable only for ghosts exiting/entering)
// '=' : Ghost house interior wall
// 'H' : Ghost house empty space
// 'X' : Unreachable / outer empty
export const INITIAL_MAZE_MAP: string[] = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  'XXXXX#.##### ## #####.#XXXXX',
  'XXXXX#.##    --    ##.#XXXXX',
  'XXXXX#.## ###==### ##.#XXXXX',
  '######.## #HHHHHH# ##.######',
  '      .   #HHHHHH#   .      ',
  '######.## #HHHHHH# ##.######',
  'XXXXX#.## ######## ##.#XXXXX',
  'XXXXX#.##          ##.#XXXXX',
  'XXXXX#.## ######## ##.#XXXXX',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##................##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];

export const PACMAN_START_POS: TileCoord = { col: 13.5, row: 23 };
export const GHOST_HOUSE_EXIT: TileCoord = { col: 13.5, row: 11 };
export const GHOST_HOUSE_CENTER: TileCoord = { col: 13.5, row: 14 };

export const GHOST_START_CONFIGS = {
  BLINKY: {
    startPos: { col: 13.5, row: 11 }, // Spawns outside directly above door
    color: '#FF0000', // Red
    scatterCorner: { col: 25, row: 0 },
    inHouse: false,
    houseTimer: 0,
  },
  PINKY: {
    startPos: { col: 13.5, row: 14 }, // Spawns inside middle
    color: '#FFB8FF', // Pink
    scatterCorner: { col: 2, row: 0 },
    inHouse: true,
    houseTimer: 60, // frames until release (~1 sec)
  },
  INKY: {
    startPos: { col: 11.5, row: 14 }, // Spawns inside left
    color: '#00FFFF', // Cyan
    scatterCorner: { col: 27, row: 31 },
    inHouse: true,
    houseTimer: 180, // frames until release (~3 sec)
  },
  CLYDE: {
    startPos: { col: 15.5, row: 14 }, // Spawns inside right
    color: '#FFB852', // Orange
    scatterCorner: { col: 0, row: 31 },
    inHouse: true,
    houseTimer: 300, // frames until release (~5 sec)
  },
};

export const FRUITS = [
  { level: 1, name: 'Cherry', points: 100, color: '#e11d48', symbol: '🍒' },
  { level: 2, name: 'Strawberry', points: 300, color: '#f43f5e', symbol: '🍓' },
  { level: 3, name: 'Peach', points: 500, color: '#fb923c', symbol: '🍑' },
  { level: 4, name: 'Apple', points: 700, color: '#ef4444', symbol: '🍎' },
  { level: 5, name: 'Grapes', points: 1000, color: '#a855f7', symbol: '🍇' },
  { level: 6, name: 'Galaxian', points: 2000, color: '#38bdf8', symbol: '🚀' },
  { level: 7, name: 'Bell', points: 3000, color: '#eab308', symbol: '🔔' },
  { level: 8, name: 'Key', points: 5000, color: '#06b6d4', symbol: '🔑' },
];

export const FRIGHTENED_COLOR = '#2563eb'; // Deep arcade blue
export const FRIGHTENED_FLASH_COLOR = '#f8fafc'; // White flash
