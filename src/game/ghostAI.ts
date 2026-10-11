import { Direction, GhostEntity, GhostMode, GhostName, PacmanEntity, TileCoord } from '../types';
import { GHOST_HOUSE_EXIT, GHOST_HOUSE_CENTER, MAP_COLS, MAP_ROWS } from './constants';

export const OPPOSITE_DIR: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
  [Direction.NONE]: Direction.NONE,
};

export const DIR_VECTORS: Record<Direction, { dc: number; dr: number }> = {
  [Direction.UP]: { dc: 0, dr: -1 },
  [Direction.DOWN]: { dc: 0, dr: 1 },
  [Direction.LEFT]: { dc: -1, dr: 0 },
  [Direction.RIGHT]: { dc: 1, dr: 0 },
  [Direction.NONE]: { dc: 0, dr: 0 },
};

// Check if a tile coordinate is a wall or unwalkable for normal movement
export function isTileWall(maze: string[], col: number, row: number, allowGate: boolean = false): boolean {
  if (row < 0 || row >= MAP_ROWS) return true;
  // Tunnel horizontal wrap
  if (row === 14 && (col < 0 || col >= MAP_COLS)) return false;
  if (col < 0 || col >= MAP_COLS) return true;

  const char = maze[row]?.[col];
  if (!char || char === '#' || char === 'X' || char === '=') return true;
  if (char === '-') return !allowGate;
  return false;
}

// Compute ghost target tile
export function getGhostTargetTile(
  ghost: GhostEntity,
  pacman: PacmanEntity,
  blinky: GhostEntity | null,
  scatterActive: boolean
): TileCoord {
  // If eaten, head directly to ghost house door
  if (ghost.mode === GhostMode.EATEN) {
    return GHOST_HOUSE_EXIT;
  }

  // If in scatter mode
  if (scatterActive || ghost.mode === GhostMode.SCATTER) {
    return ghost.scatterCorner;
  }

  // In frightened mode, target is not used directly for targeting (random turn)
  if (ghost.mode === GhostMode.FRIGHTENED) {
    return ghost.scatterCorner;
  }

  const pacCol = Math.floor(pacman.x);
  const pacRow = Math.floor(pacman.y);

  switch (ghost.name) {
    case GhostName.BLINKY:
      // Direct chase Pac-Man
      return { col: pacCol, row: pacRow };

    case GhostName.PINKY: {
      // 4 tiles ahead of Pac-Man with original arcade overflow bug for UP
      let targetCol = pacCol;
      let targetRow = pacRow;
      if (pacman.dir === Direction.UP) {
        targetCol -= 4;
        targetRow -= 4;
      } else if (pacman.dir === Direction.DOWN) {
        targetRow += 4;
      } else if (pacman.dir === Direction.LEFT) {
        targetCol -= 4;
      } else if (pacman.dir === Direction.RIGHT) {
        targetCol += 4;
      }
      return { col: targetCol, row: targetRow };
    }

    case GhostName.INKY: {
      // Inky vector: 2 tiles ahead of Pac-Man, doubled from Blinky
      let offsetCol = pacCol;
      let offsetRow = pacRow;
      if (pacman.dir === Direction.UP) {
        offsetCol -= 2;
        offsetRow -= 2;
      } else if (pacman.dir === Direction.DOWN) {
        offsetRow += 2;
      } else if (pacman.dir === Direction.LEFT) {
        offsetCol -= 2;
      } else if (pacman.dir === Direction.RIGHT) {
        offsetCol += 2;
      }

      const blinkyCol = blinky ? Math.floor(blinky.x) : pacCol;
      const blinkyRow = blinky ? Math.floor(blinky.y) : pacRow;

      const vecCol = offsetCol - blinkyCol;
      const vecRow = offsetRow - blinkyRow;

      return { col: blinkyCol + 2 * vecCol, row: blinkyRow + 2 * vecRow };
    }

    case GhostName.CLYDE: {
      // If distance >= 8, chase Pac-Man. If < 8, retreat to scatter corner
      const ghostCol = Math.floor(ghost.x);
      const ghostRow = Math.floor(ghost.y);
      const distSq = (ghostCol - pacCol) ** 2 + (ghostRow - pacRow) ** 2;
      if (distSq >= 64) {
        return { col: pacCol, row: pacRow };
      } else {
        return ghost.scatterCorner;
      }
    }
  }
}

// Choose best next direction at intersection
export function chooseGhostNextDirection(
  ghost: GhostEntity,
  maze: string[],
  target: TileCoord,
  currentTile: TileCoord
): Direction {
  // Ordered by classic arcade priority: UP, LEFT, DOWN, RIGHT
  const candidates: Direction[] = [Direction.UP, Direction.LEFT, Direction.DOWN, Direction.RIGHT];
  const opposite = OPPOSITE_DIR[ghost.dir];

  // Allow ghost house door only when eaten or exiting
  const allowGate = ghost.mode === GhostMode.EATEN || ghost.inHouse;

  const validDirs: { dir: Direction; distSq: number }[] = [];

  for (const dir of candidates) {
    // Cannot reverse 180 degrees unless stuck
    if (dir === opposite && ghost.dir !== Direction.NONE) {
      continue;
    }

    const vec = DIR_VECTORS[dir];
    const nextCol = currentTile.col + vec.dc;
    const nextRow = currentTile.row + vec.dr;

    if (!isTileWall(maze, nextCol, nextRow, allowGate)) {
      if (ghost.mode === GhostMode.FRIGHTENED) {
        // Random weight
        validDirs.push({ dir, distSq: Math.random() * 1000 });
      } else {
        const distSq = (nextCol - target.col) ** 2 + (nextRow - target.row) ** 2;
        validDirs.push({ dir, distSq });
      }
    }
  }

  // If no forward/lateral directions were valid (dead end), reverse is allowed
  if (validDirs.length === 0 && opposite !== Direction.NONE) {
    return opposite;
  }

  if (validDirs.length === 0) {
    return Direction.NONE;
  }

  // Sort by lowest distance to target
  validDirs.sort((a, b) => a.distSq - b.distSq);
  return validDirs[0].dir;
}
