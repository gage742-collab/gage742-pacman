import { Direction, FloatingText, FruitItem, GameState, GhostEntity, GhostMode, GhostName, PacmanEntity } from '../types';
import { FRIGHTENED_COLOR, FRIGHTENED_FLASH_COLOR, MAP_COLS, MAP_ROWS, TILE_SIZE } from './constants';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  maze: string[],
  pacman: PacmanEntity,
  ghosts: GhostEntity[],
  fruit: FruitItem | null,
  floatingTexts: FloatingText[],
  gameState: GameState,
  flashMaze: boolean = false
) {
  const width = MAP_COLS * TILE_SIZE;
  const height = MAP_ROWS * TILE_SIZE;

  // Clear background
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, width, height);

  // 1. Draw Maze
  drawMaze(ctx, maze, flashMaze);

  // 2. Draw Fruit if active
  if (fruit && fruit.active) {
    drawFruit(ctx, fruit);
  }

  // 3. Draw Pac-Man
  if (gameState !== GameState.GAME_OVER || pacman.deathFrame < 40) {
    drawPacman(ctx, pacman, gameState);
  }

  // 4. Draw Ghosts
  if (gameState !== GameState.PACMAN_DYING && gameState !== GameState.GAME_OVER) {
    ghosts.forEach((ghost) => drawGhost(ctx, ghost));
  }

  // 5. Draw Floating Scores
  drawFloatingTexts(ctx, floatingTexts);

  // 6. Draw Game State Overlays (READY!, PAUSED, GAME OVER)
  drawStateOverlays(ctx, gameState, width);
}

function drawMaze(ctx: CanvasRenderingContext2D, maze: string[], flashMaze: boolean) {
  const wallColor = flashMaze ? '#ffffff' : '#2563eb';
  const gateColor = '#f472b6';

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const char = maze[r]?.[c];
      const px = c * TILE_SIZE;
      const py = r * TILE_SIZE;

      if (char === '#' || char === '=') {
        ctx.fillStyle = wallColor;
        // Check adjacent tiles to draw smooth connected block edges
        const topWall = r > 0 && (maze[r - 1][c] === '#' || maze[r - 1][c] === '=');
        const btmWall = r < MAP_ROWS - 1 && (maze[r + 1][c] === '#' || maze[r + 1][c] === '=');
        const lftWall = c > 0 && (maze[r][c - 1] === '#' || maze[r][c - 1] === '=');
        const rgtWall = c < MAP_COLS - 1 && (maze[r][c + 1] === '#' || maze[r][c + 1] === '=');

        // Draw outer filled base
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Dark inner center for classic hollow arcade double-wall effect
        ctx.fillStyle = '#05070f';
        const inset = 3;
        const ix = px + (lftWall ? 0 : inset);
        const iy = py + (topWall ? 0 : inset);
        const iw = TILE_SIZE - (lftWall ? 0 : inset) - (rgtWall ? 0 : inset);
        const ih = TILE_SIZE - (topWall ? 0 : inset) - (btmWall ? 0 : inset);
        ctx.fillRect(ix, iy, iw, ih);

        // Outline glow border
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      } else if (char === '-') {
        // Ghost house gate
        ctx.fillStyle = gateColor;
        ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
      } else if (char === '.') {
        // Normal Pellet
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (char === 'o') {
        // Energizer / Power Pellet (pulsing)
        const pulse = Math.sin(Date.now() / 120) * 1.5 + 6.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, pulse, 0, Math.PI * 2);
        ctx.fill();
        // Soft outer glow
        ctx.fillStyle = 'rgba(253, 230, 138, 0.4)';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, pulse + 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPacman(ctx: CanvasRenderingContext2D, pacman: PacmanEntity, state: GameState) {
  const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
  const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;
  const radius = TILE_SIZE * 0.72;

  ctx.save();
  ctx.translate(px, py);

  if (state === GameState.PACMAN_DYING) {
    // Death spin animation
    const progress = Math.min(1, pacman.deathFrame / 30);
    const startAngle = -Math.PI / 2 + progress * Math.PI;
    const endAngle = -Math.PI / 2 - progress * Math.PI;

    if (progress < 0.9) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius * (1 - progress * 0.3), startAngle, endAngle, false);
      ctx.fill();
    } else {
      // Final pop particles
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const len = (progress - 0.9) * 40;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 3, Math.sin(angle) * 3);
        ctx.lineTo(Math.cos(angle) * (3 + len), Math.sin(angle) * (3 + len));
        ctx.stroke();
      }
    }
    ctx.restore();
    return;
  }

  // Rotation based on direction
  let rot = 0;
  if (pacman.dir === Direction.RIGHT) rot = 0;
  else if (pacman.dir === Direction.DOWN) rot = Math.PI / 2;
  else if (pacman.dir === Direction.LEFT) rot = Math.PI;
  else if (pacman.dir === Direction.UP) rot = -Math.PI / 2;

  ctx.rotate(rot);

  // Draw body with mouth wedge
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, pacman.mouthAngle, Math.PI * 2 - pacman.mouthAngle);
  ctx.lineTo(0, 0);
  ctx.fill();

  ctx.restore();
}

function drawGhost(ctx: CanvasRenderingContext2D, ghost: GhostEntity) {
  const px = ghost.x * TILE_SIZE + TILE_SIZE / 2;
  const py = ghost.y * TILE_SIZE + TILE_SIZE / 2;
  const radius = TILE_SIZE * 0.7;

  ctx.save();
  ctx.translate(px, py);

  const isFrightened = ghost.mode === GhostMode.FRIGHTENED;
  const isEaten = ghost.mode === GhostMode.EATEN;
  const isFlashing = isFrightened && ghost.frightenedTimer < 120 && Math.floor(ghost.frightenedTimer / 10) % 2 === 0;

  // If not eaten, draw ghost body and skirt
  if (!isEaten) {
    const bodyColor = isFrightened
      ? isFlashing
        ? FRIGHTENED_FLASH_COLOR
        : FRIGHTENED_COLOR
      : ghost.color;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    // Top dome
    ctx.arc(0, -2, radius, Math.PI, 0, false);
    // Right side
    ctx.lineTo(radius, radius * 0.9);

    // Animated 3-peak skirt wave
    const wave = Math.sin(Date.now() / 90) * 2;
    const w = (radius * 2) / 3;
    ctx.lineTo(radius - w * 0.5, radius * 0.6 + wave);
    ctx.lineTo(radius - w, radius * 0.9);
    ctx.lineTo(radius - w * 1.5, radius * 0.6 - wave);
    ctx.lineTo(-radius + w, radius * 0.9);
    ctx.lineTo(-radius + w * 0.5, radius * 0.6 + wave);
    ctx.lineTo(-radius, radius * 0.9);

    ctx.closePath();
    ctx.fill();
  }

  // Draw eyes
  if (isFrightened && !isEaten) {
    // Frightened face (small dots for eyes and squiggly mouth)
    ctx.fillStyle = isFlashing ? '#ef4444' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(-radius * 0.4, -radius * 0.2, 2, 0, Math.PI * 2);
    ctx.arc(radius * 0.4, -radius * 0.2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Squiggly mouth
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#f8fafc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, radius * 0.35);
    ctx.lineTo(-radius * 0.25, radius * 0.15);
    ctx.lineTo(0, radius * 0.35);
    ctx.lineTo(radius * 0.25, radius * 0.15);
    ctx.lineTo(radius * 0.5, radius * 0.35);
    ctx.stroke();
  } else {
    // Normal or Eaten eyes pointing in ghost direction
    let lookX = 0;
    let lookY = 0;
    if (ghost.dir === Direction.LEFT) lookX = -2.5;
    else if (ghost.dir === Direction.RIGHT) lookX = 2.5;
    else if (ghost.dir === Direction.UP) lookY = -2.5;
    else if (ghost.dir === Direction.DOWN) lookY = 2.5;

    // Eye whites
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.4, -radius * 0.2, radius * 0.32, radius * 0.42, 0, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.4, -radius * 0.2, radius * 0.32, radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye pupils
    ctx.fillStyle = '#1e3a8a'; // Deep blue pupils
    ctx.beginPath();
    ctx.arc(-radius * 0.4 + lookX, -radius * 0.2 + lookY, radius * 0.2, 0, Math.PI * 2);
    ctx.arc(radius * 0.4 + lookX, -radius * 0.2 + lookY, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFruit(ctx: CanvasRenderingContext2D, fruit: FruitItem) {
  const px = fruit.col * TILE_SIZE + TILE_SIZE / 2;
  const py = fruit.row * TILE_SIZE + TILE_SIZE / 2;

  ctx.save();
  ctx.translate(px, py);

  ctx.font = '16px "Press Start 2P", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fruit.symbol, 0, 0);

  ctx.restore();
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  texts.forEach((item) => {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = item.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  });
}

function drawStateOverlays(ctx: CanvasRenderingContext2D, state: GameState, width: number) {
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const centerX = width / 2;
  const centerY = 17 * TILE_SIZE + TILE_SIZE / 2;

  if (state === GameState.READY) {
    ctx.fillStyle = '#facc15'; // Arcade yellow
    ctx.fillText('READY!', centerX, centerY);
  } else if (state === GameState.PAUSED) {
    ctx.fillStyle = '#38bdf8'; // Cyan
    ctx.fillText('PAUSED', centerX, centerY);
  } else if (state === GameState.GAME_OVER) {
    ctx.fillStyle = '#ef4444'; // Red
    ctx.fillText('GAME  OVER', centerX, centerY);
  } else if (state === GameState.LEVEL_CLEARED) {
    ctx.fillStyle = '#22c55e'; // Green
    ctx.fillText('STAGE CLEAR!', centerX, centerY);
  }
}
