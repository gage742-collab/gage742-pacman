import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Code2,
  Gauge,
  Keyboard,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Direction, GameSpeedPreset, GameState } from '../types';

interface ArcadeControlsProps {
  onDirection: (dir: Direction) => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleCrt: () => void;
  onOpenPygameModal: () => void;
  onSelectSpeedPreset: (preset: GameSpeedPreset) => void;
  gameState: GameState;
  isMuted: boolean;
  crtEnabled: boolean;
  speedPreset: GameSpeedPreset;
  activeKeyDir: Direction;
}

export const ArcadeControls: React.FC<ArcadeControlsProps> = ({
  onDirection,
  onTogglePause,
  onRestart,
  onToggleMute,
  onToggleCrt,
  onOpenPygameModal,
  onSelectSpeedPreset,
  gameState,
  isMuted,
  crtEnabled,
  speedPreset,
  activeKeyDir,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 mt-2 px-2">
      {/* Game Speed Selector Banner */}
      <div className="flex items-center justify-between gap-2 bg-neutral-900/90 border border-neutral-800/80 rounded-xl px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
          <Gauge className="w-3.5 h-3.5 text-yellow-400" />
          <span>Game Speed:</span>
        </div>

        <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
          <button
            id="speed-slow-btn"
            type="button"
            onClick={() => onSelectSpeedPreset(GameSpeedPreset.SLOW)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              speedPreset === GameSpeedPreset.SLOW
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Slow, relaxed arcade pace (Key 1)"
          >
            Slow (Casual)
          </button>
          <button
            id="speed-normal-btn"
            type="button"
            onClick={() => onSelectSpeedPreset(GameSpeedPreset.NORMAL)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              speedPreset === GameSpeedPreset.NORMAL
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Normal arcade speed (Key 2)"
          >
            Normal
          </button>
          <button
            id="speed-fast-btn"
            type="button"
            onClick={() => onSelectSpeedPreset(GameSpeedPreset.FAST)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              speedPreset === GameSpeedPreset.FAST
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Fast turbo speed (Key 3)"
          >
            Fast
          </button>
        </div>
      </div>

      {/* Primary Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            id="pause-play-btn"
            onClick={onTogglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition active:scale-95 font-medium cursor-pointer"
            title={gameState === GameState.PAUSED ? 'Resume (Space)' : 'Pause (Space)'}
          >
            {gameState === GameState.PAUSED ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-yellow-400" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            id="restart-game-btn"
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition active:scale-95 font-medium cursor-pointer"
            title="Restart Game (R)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Restart</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-audio-btn"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition active:scale-95 cursor-pointer"
            title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            id="toggle-crt-btn"
            onClick={onToggleCrt}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 cursor-pointer ${
              crtEnabled
                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-400'
                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Toggle CRT Scanline Effect"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>CRT</span>
          </button>

          <button
            id="open-pygame-code-btn"
            onClick={onOpenPygameModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            title="View & Download Pygame Python Script"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Pygame (.py)</span>
          </button>
        </div>
      </div>

      {/* Arcade D-Pad & Keyboard Active Status */}
      <div className="flex flex-col items-center justify-center pt-1 pb-1">
        <div className="relative w-36 h-36 bg-neutral-900/90 border border-neutral-800 rounded-full p-2 shadow-inner flex items-center justify-center">
          {/* UP */}
          <button
            id="dpad-up"
            onPointerDown={() => onDirection(Direction.UP)}
            className={`absolute top-1.5 w-10 h-10 rounded-lg flex items-center justify-center shadow transition active:scale-95 cursor-pointer ${
              activeKeyDir === Direction.UP
                ? 'bg-yellow-400 text-black ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            aria-label="Up"
            title="Move Up (↑ or W)"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* LEFT */}
          <button
            id="dpad-left"
            onPointerDown={() => onDirection(Direction.LEFT)}
            className={`absolute left-1.5 w-10 h-10 rounded-lg flex items-center justify-center shadow transition active:scale-95 cursor-pointer ${
              activeKeyDir === Direction.LEFT
                ? 'bg-yellow-400 text-black ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            aria-label="Left"
            title="Move Left (← or A)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* CENTER DISC */}
          <div className="w-8 h-8 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 animate-pulse" />
          </div>

          {/* RIGHT */}
          <button
            id="dpad-right"
            onPointerDown={() => onDirection(Direction.RIGHT)}
            className={`absolute right-1.5 w-10 h-10 rounded-lg flex items-center justify-center shadow transition active:scale-95 cursor-pointer ${
              activeKeyDir === Direction.RIGHT
                ? 'bg-yellow-400 text-black ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            aria-label="Right"
            title="Move Right (→ or D)"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* DOWN */}
          <button
            id="dpad-down"
            onPointerDown={() => onDirection(Direction.DOWN)}
            className={`absolute bottom-1.5 w-10 h-10 rounded-lg flex items-center justify-center shadow transition active:scale-95 cursor-pointer ${
              activeKeyDir === Direction.DOWN
                ? 'bg-yellow-400 text-black ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            aria-label="Down"
            title="Move Down (↓ or S)"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard Controls Bar */}
      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 bg-neutral-950/80 border border-neutral-800/80 rounded-lg px-3 py-1.5 text-[11px] text-neutral-300">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <Keyboard className="w-3.5 h-3.5" />
          <span>Keyboard Ready:</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-yellow-400 font-mono text-[10px]">
            ↑ ↓ ← →
          </kbd>
          <span className="text-neutral-500">or</span>
          <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-yellow-400 font-mono text-[10px]">
            W A S D
          </kbd>
          <span className="text-neutral-400 ml-0.5">to move</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 font-mono text-[10px]">
            Space
          </kbd>
          <span>Pause</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 font-mono text-[10px]">
            1 2 3
          </kbd>
          <span>Speed</span>
        </div>
      </div>
    </div>
  );
};
