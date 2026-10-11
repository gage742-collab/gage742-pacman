import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Direction,
  FloatingText,
  FruitItem,
  GameSpeedPreset,
  GameState,
  GhostEntity,
  GhostMode,
  GhostName,
  PacmanEntity,
  TileCoord,
} from '../types';
import { arcadeAudio } from './audio';
import { renderGame } from './canvasRenderer';
import {
  FRUITS,
  GHOST_HOUSE_CENTER,
  GHOST_HOUSE_EXIT,
  GHOST_START_CONFIGS,
  INITIAL_MAZE_MAP,
  MAP_COLS,
  MAP_ROWS,
  PACMAN_START_POS,
  SPEED_PRESETS,
  TILE_SIZE,
} from './constants';
import {
  chooseGhostNextDirection,
  DIR_VECTORS,
  getGhostTargetTile,
  isTileWall,
  OPPOSITE_DIR,
} from './ghostAI';

const HIGH_SCORE_KEY = 'pacman_arcade_high_score';

export function usePacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gameplay stats
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [isMuted, setIsMuted] = useState(arcadeAudio.getMuted());
  const [crtEnabled, setCrtEnabled] = useState(true);

  // Speed setting (Default: SLOW for relaxed, smooth control)
  const [speedPreset, setSpeedPreset] = useState<GameSpeedPreset>(GameSpeedPreset.SLOW);
  const [activeKeyDir, setActiveKeyDir] = useState<Direction>(Direction.NONE);

  // Internal mutable refs for high-frequency 60fps loop
  const speedPresetRef = useRef<GameSpeedPreset>(speedPreset);
  speedPresetRef.current = speedPreset;

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const mazeRef = useRef<string[]>([...INITIAL_MAZE_MAP]);
  const pelletsLeftRef = useRef<number>(0);
  const totalPelletsRef = useRef<number>(0);

  const pacmanRef = useRef<PacmanEntity>({
    x: PACMAN_START_POS.col,
    y: PACMAN_START_POS.row,
    dir: Direction.NONE,
    nextDir: Direction.NONE,
    mouthAngle: 0.2,
    mouthDir: 1,
    speed: SPEED_PRESETS[GameSpeedPreset.SLOW].pacmanSpeed,
    deathFrame: 0,
  });

  const ghostsRef = useRef<GhostEntity[]>([]);
  const fruitRef = useRef<FruitItem | null>(null);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const ghostsEatenInStreakRef = useRef(0);
  const globalTimerRef = useRef(0);
  const freezeFramesRef = useRef(0);
  const stateTimerRef = useRef(0);
  const flashMazeRef = useRef(false);

  // Initialize maze pellets
  const initMaze = useCallback(() => {
    const freshMaze = [...INITIAL_MAZE_MAP];
    let count = 0;
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const ch = freshMaze[r][c];
        if (ch === '.' || ch === 'o') {
          count++;
        }
      }
    }
    mazeRef.current = freshMaze;
    pelletsLeftRef.current = count;
    totalPelletsRef.current = count;
  }, []);

  // Initialize ghosts with speed scaled to current preset and level
  const initGhosts = useCallback((curLevel: number, currentPreset: GameSpeedPreset) => {
    const basePresetSpeed = SPEED_PRESETS[currentPreset].ghostSpeed;
    const baseSpeed = basePresetSpeed + Math.min(0.015, (curLevel - 1) * 0.003);

    ghostsRef.current = [
      {
        name: GhostName.BLINKY,
        x: GHOST_START_CONFIGS.BLINKY.startPos.col,
        y: GHOST_START_CONFIGS.BLINKY.startPos.row,
        dir: Direction.LEFT,
        nextDir: Direction.LEFT,
        mode: GhostMode.CHASE,
        target: { col: 0, row: 0 },
        speed: baseSpeed,
        inHouse: false,
        houseTimer: 0,
        frightenedTimer: 0,
        color: GHOST_START_CONFIGS.BLINKY.color,
        scatterCorner: GHOST_START_CONFIGS.BLINKY.scatterCorner,
      },
      {
        name: GhostName.PINKY,
        x: GHOST_START_CONFIGS.PINKY.startPos.col,
        y: GHOST_START_CONFIGS.PINKY.startPos.row,
        dir: Direction.UP,
        nextDir: Direction.UP,
        mode: GhostMode.CHASE,
        target: { col: 0, row: 0 },
        speed: baseSpeed * 0.94,
        inHouse: true,
        houseTimer: 50,
        frightenedTimer: 0,
        color: GHOST_START_CONFIGS.PINKY.color,
        scatterCorner: GHOST_START_CONFIGS.PINKY.scatterCorner,
      },
      {
        name: GhostName.INKY,
        x: GHOST_START_CONFIGS.INKY.startPos.col,
        y: GHOST_START_CONFIGS.INKY.startPos.row,
        dir: Direction.UP,
        nextDir: Direction.UP,
        mode: GhostMode.CHASE,
        target: { col: 0, row: 0 },
        speed: baseSpeed * 0.9,
        inHouse: true,
        houseTimer: 140,
        frightenedTimer: 0,
        color: GHOST_START_CONFIGS.INKY.color,
        scatterCorner: GHOST_START_CONFIGS.INKY.scatterCorner,
      },
      {
        name: GhostName.CLYDE,
        x: GHOST_START_CONFIGS.CLYDE.startPos.col,
        y: GHOST_START_CONFIGS.CLYDE.startPos.row,
        dir: Direction.UP,
        nextDir: Direction.UP,
        mode: GhostMode.CHASE,
        target: { col: 0, row: 0 },
        speed: baseSpeed * 0.88,
        inHouse: true,
        houseTimer: 240,
        frightenedTimer: 0,
        color: GHOST_START_CONFIGS.CLYDE.color,
        scatterCorner: GHOST_START_CONFIGS.CLYDE.scatterCorner,
      },
    ];
  }, []);

  // Update entity speeds when preset changes
  const applySpeedPreset = useCallback((preset: GameSpeedPreset) => {
    setSpeedPreset(preset);
    const pSpeed = SPEED_PRESETS[preset].pacmanSpeed;
    pacmanRef.current.speed = pSpeed;

    const baseGhostSpeed = SPEED_PRESETS[preset].ghostSpeed;
    ghostsRef.current.forEach((g) => {
      if (g.name === GhostName.BLINKY) g.speed = baseGhostSpeed;
      else if (g.name === GhostName.PINKY) g.speed = baseGhostSpeed * 0.94;
      else if (g.name === GhostName.INKY) g.speed = baseGhostSpeed * 0.9;
      else if (g.name === GhostName.CLYDE) g.speed = baseGhostSpeed * 0.88;
    });
  }, []);

  // Reset positions (e.g. after pacman death or round start)
  const resetPositions = useCallback(() => {
    const curPreset = speedPresetRef.current;
    pacmanRef.current = {
      x: PACMAN_START_POS.col,
      y: PACMAN_START_POS.row,
      dir: Direction.NONE,
      nextDir: Direction.NONE,
      mouthAngle: 0.2,
      mouthDir: 1,
      speed: SPEED_PRESETS[curPreset].pacmanSpeed,
      deathFrame: 0,
    };
    initGhosts(level, curPreset);
    fruitRef.current = null;
    ghostsEatenInStreakRef.current = 0;
  }, [initGhosts, level]);

  // Start fresh game
  const startNewGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    initMaze();
    resetPositions();
    setGameState(GameState.READY);
    stateTimerRef.current = 100;
    arcadeAudio.playStartJingle();
  }, [initMaze, resetPositions]);

  // Pause / Resume
  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === GameState.PLAYING) return GameState.PAUSED;
      if (prev === GameState.PAUSED) return GameState.PLAYING;
      return prev;
    });
  }, []);

  // Restart
  const restart = useCallback(() => {
    startNewGame();
  }, [startNewGame]);

  // Handle Input Direction (Keyboard, D-Pad, Swipes)
  const handleInputDirection = useCallback(
    (dir: Direction) => {
      if (dir === Direction.NONE) return;

      // If in READY mode, start immediately on first direction input
      if (gameStateRef.current === GameState.READY) {
        setGameState(GameState.PLAYING);
      }

      if (
        gameStateRef.current !== GameState.PLAYING &&
        gameStateRef.current !== GameState.READY
      ) {
        return;
      }

      const p = pacmanRef.current;
      const maze = mazeRef.current;
      p.nextDir = dir;
      setActiveKeyDir(dir);

      // Instant 180-degree reverse if pressing opposite direction
      if (p.dir !== Direction.NONE && dir === OPPOSITE_DIR[p.dir]) {
        p.dir = dir;
        return;
      }

      // If Pac-Man is currently stationary, check if requested direction is walkable right now
      if (p.dir === Direction.NONE) {
        const vec = DIR_VECTORS[dir];
        let targetCol = Math.round(p.x) + vec.dc;
        let targetRow = Math.round(p.y) + vec.dr;

        // If Pacman is at half-tile (e.g. 13.5 at start), check the immediate tile in that direction
        if (vec.dc < 0) targetCol = Math.floor(p.x);
        if (vec.dc > 0) targetCol = Math.ceil(p.x);
        if (vec.dr < 0) targetRow = Math.floor(p.y);
        if (vec.dr > 0) targetRow = Math.ceil(p.y);

        if (!isTileWall(maze, targetCol, targetRow, false)) {
          p.dir = dir;
          if (dir === Direction.LEFT || dir === Direction.RIGHT) {
            p.y = Math.round(p.y);
          } else {
            p.x = Math.round(p.x);
          }
        }
      }
    },
    []
  );

  // Initialize on mount
  useEffect(() => {
    initMaze();
    initGhosts(1, GameSpeedPreset.SLOW);
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Event Listener (Captures on both window and document)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll for game keys
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          ' ',
          'w',
          'a',
          's',
          'd',
          'W',
          'A',
          'S',
          'D',
        ].includes(e.key) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }

      // Movement controls (Arrows and WASD)
      if (
        e.key === 'ArrowUp' ||
        e.code === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'W' ||
        e.code === 'KeyW'
      ) {
        handleInputDirection(Direction.UP);
        return;
      }
      if (
        e.key === 'ArrowDown' ||
        e.code === 'ArrowDown' ||
        e.key === 's' ||
        e.key === 'S' ||
        e.code === 'KeyS'
      ) {
        handleInputDirection(Direction.DOWN);
        return;
      }
      if (
        e.key === 'ArrowLeft' ||
        e.code === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.code === 'KeyA'
      ) {
        handleInputDirection(Direction.LEFT);
        return;
      }
      if (
        e.key === 'ArrowRight' ||
        e.code === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'D' ||
        e.code === 'KeyD'
      ) {
        handleInputDirection(Direction.RIGHT);
        return;
      }

      // Speed shortcuts: 1 = Slow, 2 = Normal, 3 = Fast
      if (e.key === '1') {
        applySpeedPreset(GameSpeedPreset.SLOW);
        return;
      }
      if (e.key === '2') {
        applySpeedPreset(GameSpeedPreset.NORMAL);
        return;
      }
      if (e.key === '3') {
        applySpeedPreset(GameSpeedPreset.FAST);
        return;
      }

      // Actions
      if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.code === 'Space') {
        togglePause();
        return;
      }
      if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
        restart();
        return;
      }
      if (e.key === 'm' || e.key === 'M' || e.code === 'KeyM') {
        const muted = arcadeAudio.toggleMute();
        setIsMuted(muted);
        return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
      if (keys.includes(e.key.toLowerCase())) {
        setActiveKeyDir(Direction.NONE);
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleInputDirection, togglePause, restart, applySpeedPreset]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      globalTimerRef.current++;
      const p = pacmanRef.current;
      const ghosts = ghostsRef.current;
      const maze = mazeRef.current;
      const curGameState = gameStateRef.current;

      // Update floating score texts
      if (floatingTextsRef.current.length > 0) {
        floatingTextsRef.current = floatingTextsRef.current
          .map((item) => ({
            ...item,
            y: item.y - 0.4,
            lifetime: item.lifetime + 1,
          }))
          .filter((item) => item.lifetime < item.maxLifetime);
      }

      // State transitions
      if (curGameState === GameState.READY) {
        stateTimerRef.current--;
        if (stateTimerRef.current <= 0) {
          setGameState(GameState.PLAYING);
        }
      } else if (curGameState === GameState.PACMAN_DYING) {
        p.deathFrame++;
        if (p.deathFrame >= 45) {
          if (lives > 1) {
            setLives((l) => l - 1);
            resetPositions();
            setGameState(GameState.READY);
            stateTimerRef.current = 80;
          } else {
            setLives(0);
            setGameState(GameState.GAME_OVER);
          }
        }
      } else if (curGameState === GameState.LEVEL_CLEARED) {
        stateTimerRef.current--;
        flashMazeRef.current = Math.floor(stateTimerRef.current / 8) % 2 === 0;
        if (stateTimerRef.current <= 0) {
          flashMazeRef.current = false;
          setLevel((lvl) => {
            const nextLvl = lvl + 1;
            initMaze();
            initGhosts(nextLvl, speedPresetRef.current);
            resetPositions();
            setGameState(GameState.READY);
            stateTimerRef.current = 80;
            return nextLvl;
          });
        }
      } else if (curGameState === GameState.PLAYING) {
        // Freeze frame handling for ghost eating impact
        if (freezeFramesRef.current > 0) {
          freezeFramesRef.current--;
        } else {
          // -------------------------------------------------------------
          // 1. UPDATE PAC-MAN MOVEMENT & CORNERING
          // -------------------------------------------------------------
          // Mouth animation
          p.mouthAngle += 0.045 * p.mouthDir;
          if (p.mouthAngle > 0.55) {
            p.mouthAngle = 0.55;
            p.mouthDir = -1;
          } else if (p.mouthAngle < 0.05) {
            p.mouthAngle = 0.05;
            p.mouthDir = 1;
          }

          const curSpeed = p.speed;

          // Cornering / Pre-turn Check:
          // If player has a buffered nextDir perpendicular to current direction,
          // check if we are within the cornering window of an open turn.
          if (p.nextDir !== Direction.NONE && p.nextDir !== p.dir) {
            const movingHoriz = p.dir === Direction.LEFT || p.dir === Direction.RIGHT;
            const wantVertical = p.nextDir === Direction.UP || p.nextDir === Direction.DOWN;

            if (movingHoriz && wantVertical) {
              const nearestCol = Math.round(p.x);
              const curRow = Math.round(p.y);
              const dr = p.nextDir === Direction.UP ? -1 : 1;

              // Check if perpendicular corridor is open
              if (!isTileWall(maze, nearestCol, curRow + dr, false)) {
                // If within turning tolerance (0.42 tiles), corner smoothly into the turn
                if (Math.abs(p.x - nearestCol) <= 0.42) {
                  p.x = nearestCol;
                  p.y = curRow;
                  p.dir = p.nextDir;
                  p.nextDir = Direction.NONE;
                }
              }
            } else if (!movingHoriz && !wantVertical && p.dir !== Direction.NONE) {
              const nearestRow = Math.round(p.y);
              const curCol = Math.round(p.x);
              const dc = p.nextDir === Direction.LEFT ? -1 : 1;

              if (!isTileWall(maze, curCol + dc, nearestRow, false)) {
                if (Math.abs(p.y - nearestRow) <= 0.42) {
                  p.x = curCol;
                  p.y = nearestRow;
                  p.dir = p.nextDir;
                  p.nextDir = Direction.NONE;
                }
              }
            }
          }

          // Advance Pac-Man forward in current direction
          if (p.dir !== Direction.NONE) {
            const vec = DIR_VECTORS[p.dir];
            const isHoriz = p.dir === Direction.LEFT || p.dir === Direction.RIGHT;

            if (isHoriz) {
              p.y = Math.round(p.y); // Lock tightly to horizontal rail
              const nextX = p.x + vec.dc * curSpeed;

              // Check wall collision ahead
              if (vec.dc > 0) {
                const checkCol = Math.floor(nextX + 0.5);
                if (isTileWall(maze, checkCol, p.y, false)) {
                  p.x = Math.round(p.x);
                  p.dir = Direction.NONE;
                } else {
                  p.x = nextX;
                }
              } else {
                const checkCol = Math.ceil(nextX - 0.5);
                if (isTileWall(maze, checkCol, p.y, false)) {
                  p.x = Math.round(p.x);
                  p.dir = Direction.NONE;
                } else {
                  p.x = nextX;
                }
              }
            } else {
              p.x = Math.round(p.x); // Lock tightly to vertical rail
              const nextY = p.y + vec.dr * curSpeed;

              // Check wall collision ahead
              if (vec.dr > 0) {
                const checkRow = Math.floor(nextY + 0.5);
                if (isTileWall(maze, p.x, checkRow, false)) {
                  p.y = Math.round(p.y);
                  p.dir = Direction.NONE;
                } else {
                  p.y = nextY;
                }
              } else {
                const checkRow = Math.ceil(nextY - 0.5);
                if (isTileWall(maze, p.x, checkRow, false)) {
                  p.y = Math.round(p.y);
                  p.dir = Direction.NONE;
                } else {
                  p.y = nextY;
                }
              }
            }

            // Horizontal tunnel wrap at row 14
            if (Math.round(p.y) === 14) {
              if (p.x < -0.5) p.x = MAP_COLS - 0.5;
              else if (p.x > MAP_COLS - 0.5) p.x = -0.5;
            }
          }

          // -------------------------------------------------------------
          // 2. CHECK PELLET & ENERGIZER CONSUMPTION
          // -------------------------------------------------------------
          const pacTileCol = Math.round(p.x);
          const pacTileRow = Math.round(p.y);

          if (
            pacTileRow >= 0 &&
            pacTileRow < MAP_ROWS &&
            pacTileCol >= 0 &&
            pacTileCol < MAP_COLS
          ) {
            const tileChar = maze[pacTileRow]?.[pacTileCol];

            if (tileChar === '.') {
              // Eat standard pellet
              const rowStr = maze[pacTileRow];
              maze[pacTileRow] =
                rowStr.substring(0, pacTileCol) + ' ' + rowStr.substring(pacTileCol + 1);
              pelletsLeftRef.current--;
              arcadeAudio.playWaka();

              setScore((s) => {
                const nextScore = s + 10;
                setHighScore((hs) => {
                  if (nextScore > hs) {
                    try {
                      localStorage.setItem(HIGH_SCORE_KEY, nextScore.toString());
                    } catch {}
                    return nextScore;
                  }
                  return hs;
                });
                return nextScore;
              });

              // Check fruit spawn triggers
              const eaten = totalPelletsRef.current - pelletsLeftRef.current;
              if (eaten === 70 || eaten === 170) {
                const fruitIdx = Math.min(level - 1, FRUITS.length - 1);
                const fruitConfig = FRUITS[fruitIdx];
                fruitRef.current = {
                  ...fruitConfig,
                  col: 13.5,
                  row: 17,
                  active: true,
                  timer: 600,
                };
              }

              // Check Level Clear
              if (pelletsLeftRef.current <= 0) {
                setGameState(GameState.LEVEL_CLEARED);
                stateTimerRef.current = 140;
                arcadeAudio.playLevelClear();
              }
            } else if (tileChar === 'o') {
              // Eat Energizer / Power Pellet
              const rowStr = maze[pacTileRow];
              maze[pacTileRow] =
                rowStr.substring(0, pacTileCol) + ' ' + rowStr.substring(pacTileCol + 1);
              pelletsLeftRef.current--;
              arcadeAudio.playPowerPellet();

              setScore((s) => {
                const nextScore = s + 50;
                setHighScore((hs) => {
                  if (nextScore > hs) {
                    try {
                      localStorage.setItem(HIGH_SCORE_KEY, nextScore.toString());
                    } catch {}
                    return nextScore;
                  }
                  return hs;
                });
                return nextScore;
              });

              // Trigger Frightened Mode for active ghosts
              ghostsEatenInStreakRef.current = 0;
              const frightenedDuration = Math.max(160, 420 - level * 35);

              ghosts.forEach((ghost) => {
                if (ghost.mode !== GhostMode.EATEN) {
                  ghost.mode = GhostMode.FRIGHTENED;
                  ghost.frightenedTimer = frightenedDuration;
                  if (ghost.dir !== Direction.NONE) {
                    ghost.dir = OPPOSITE_DIR[ghost.dir];
                  }
                }
              });

              if (pelletsLeftRef.current <= 0) {
                setGameState(GameState.LEVEL_CLEARED);
                stateTimerRef.current = 140;
                arcadeAudio.playLevelClear();
              }
            }
          }

          // -------------------------------------------------------------
          // 3. UPDATE FRUIT BONUS
          // -------------------------------------------------------------
          if (fruitRef.current && fruitRef.current.active) {
            fruitRef.current.timer--;
            if (fruitRef.current.timer <= 0) {
              fruitRef.current.active = false;
            } else {
              const dist = (p.x - fruitRef.current.col) ** 2 + (p.y - fruitRef.current.row) ** 2;
              if (dist < 0.6) {
                const pts = fruitRef.current.points;
                arcadeAudio.playFruitEaten();
                fruitRef.current.active = false;
                setScore((s) => s + pts);
                floatingTextsRef.current.push({
                  id: Date.now(),
                  text: `+${pts}`,
                  x: fruitRef.current.col * TILE_SIZE + TILE_SIZE / 2,
                  y: fruitRef.current.row * TILE_SIZE,
                  color: '#fbbf24',
                  lifetime: 0,
                  maxLifetime: 45,
                });
              }
            }
          }

          // -------------------------------------------------------------
          // 4. UPDATE GHOSTS (Proportional speed, smooth tile turns)
          // -------------------------------------------------------------
          const blinky = ghosts.find((g) => g.name === GhostName.BLINKY) || null;
          const cycleTime = globalTimerRef.current % 1600;
          const scatterActive = cycleTime < 420;

          ghosts.forEach((ghost) => {
            // In House logic
            if (ghost.inHouse) {
              ghost.houseTimer--;
              if (ghost.houseTimer <= 0) {
                const dx = GHOST_HOUSE_EXIT.col - ghost.x;
                const dy = GHOST_HOUSE_EXIT.row - ghost.y;
                if (Math.abs(dx) > 0.04) {
                  ghost.x += Math.sign(dx) * 0.04;
                } else if (Math.abs(dy) > 0.04) {
                  ghost.y += Math.sign(dy) * 0.04;
                } else {
                  ghost.inHouse = false;
                  ghost.x = GHOST_HOUSE_EXIT.col;
                  ghost.y = GHOST_HOUSE_EXIT.row;
                  ghost.dir = Direction.LEFT;
                }
              } else {
                ghost.y = GHOST_HOUSE_CENTER.row + Math.sin(globalTimerRef.current * 0.06) * 0.35;
              }
              return;
            }

            // Frightened Timer countdown
            if (ghost.mode === GhostMode.FRIGHTENED) {
              ghost.frightenedTimer--;
              if (ghost.frightenedTimer <= 0) {
                ghost.mode = GhostMode.CHASE;
              }
            }

            // Eaten mode (eyes returning to ghost house)
            if (ghost.mode === GhostMode.EATEN) {
              const distToDoor =
                (ghost.x - GHOST_HOUSE_EXIT.col) ** 2 + (ghost.y - GHOST_HOUSE_EXIT.row) ** 2;
              if (distToDoor < 0.25) {
                ghost.mode = GhostMode.CHASE;
                ghost.inHouse = true;
                ghost.houseTimer = 30;
                return;
              }
            }

            // Calculate ghost speed
            let gSpeed = ghost.speed;
            if (ghost.mode === GhostMode.FRIGHTENED) {
              gSpeed = ghost.speed * 0.55;
            } else if (ghost.mode === GhostMode.EATEN) {
              gSpeed = ghost.speed * 2.1;
            } else if (Math.round(ghost.y) === 14 && (ghost.x < 5 || ghost.x > 22)) {
              gSpeed = ghost.speed * 0.55; // slow down in tunnels
            }

            // Clean pathfinding decisions at tile intersections
            const gCol = Math.round(ghost.x);
            const gRow = Math.round(ghost.y);
            const distToCenter = Math.abs(ghost.x - gCol) + Math.abs(ghost.y - gRow);

            if (
              distToCenter <= gSpeed * 1.2 &&
              (gCol !== ghost.lastDecisionCol || gRow !== ghost.lastDecisionRow)
            ) {
              ghost.lastDecisionCol = gCol;
              ghost.lastDecisionRow = gRow;

              const targetTile = getGhostTargetTile(ghost, p, blinky, scatterActive);
              const nextDir = chooseGhostNextDirection(ghost, maze, targetTile, {
                col: gCol,
                row: gRow,
              });

              if (nextDir !== Direction.NONE) {
                ghost.dir = nextDir;
                if (ghost.dir === Direction.UP || ghost.dir === Direction.DOWN) {
                  ghost.x = gCol;
                } else {
                  ghost.y = gRow;
                }
              }
            }

            // Advance ghost forward
            const gVec = DIR_VECTORS[ghost.dir];
            ghost.x += gVec.dc * gSpeed;
            ghost.y += gVec.dr * gSpeed;

            // Ghost tunnel wrap
            if (Math.round(ghost.y) === 14) {
              if (ghost.x < -0.5) ghost.x = MAP_COLS - 0.5;
              else if (ghost.x > MAP_COLS - 0.5) ghost.x = -0.5;
            }

            // -------------------------------------------------------------
            // 5. PAC-MAN vs GHOST COLLISION
            // -------------------------------------------------------------
            const distToPacmanSq = (p.x - ghost.x) ** 2 + (p.y - ghost.y) ** 2;
            if (distToPacmanSq < 0.49) {
              if (ghost.mode === GhostMode.FRIGHTENED) {
                // Eat ghost!
                ghost.mode = GhostMode.EATEN;
                arcadeAudio.playGhostEaten();
                freezeFramesRef.current = 10;

                const ghostPoints = 200 * Math.pow(2, ghostsEatenInStreakRef.current);
                ghostsEatenInStreakRef.current = Math.min(3, ghostsEatenInStreakRef.current + 1);

                setScore((s) => {
                  const next = s + ghostPoints;
                  setHighScore((hs) => Math.max(hs, next));
                  return next;
                });

                floatingTextsRef.current.push({
                  id: Date.now() + Math.random(),
                  text: `${ghostPoints}`,
                  x: ghost.x * TILE_SIZE + TILE_SIZE / 2,
                  y: ghost.y * TILE_SIZE + TILE_SIZE / 2,
                  color: '#38bdf8',
                  lifetime: 0,
                  maxLifetime: 40,
                });
              } else if (ghost.mode !== GhostMode.EATEN) {
                // Pac-Man caught
                setGameState(GameState.PACMAN_DYING);
                p.deathFrame = 0;
                arcadeAudio.playDeath();
              }
            }
          });
        }
      }

      // -------------------------------------------------------------
      // 6. RENDER FRAME
      // -------------------------------------------------------------
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGame(
            ctx,
            mazeRef.current,
            pacmanRef.current,
            ghostsRef.current,
            fruitRef.current,
            floatingTextsRef.current,
            gameStateRef.current,
            flashMazeRef.current
          );
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [lives, level, initMaze, initGhosts, resetPositions]);

  return {
    canvasRef,
    score,
    highScore,
    lives,
    level,
    gameState,
    isMuted,
    crtEnabled,
    speedPreset,
    activeKeyDir,
    handleInputDirection,
    applySpeedPreset,
    togglePause,
    restart,
    toggleMute: () => {
      const m = arcadeAudio.toggleMute();
      setIsMuted(m);
    },
    toggleCrt: () => setCrtEnabled((c) => !c),
  };
}
