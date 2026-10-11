import React, { useEffect, useRef, useState } from 'react';
import { ArcadeControls } from './components/ArcadeControls';
import { ArcadeMarquee } from './components/ArcadeMarquee';
import { PygameCodeModal } from './components/PygameCodeModal';
import { MAP_COLS, MAP_ROWS, TILE_SIZE } from './game/constants';
import { usePacmanGame } from './game/usePacmanGame';
import { Direction } from './types';

export default function App() {
  const {
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
    toggleMute,
    toggleCrt,
  } = usePacmanGame();

  const [isPygameModalOpen, setIsPygameModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-focus container on load so keys are immediately captured
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Swipe gesture handling for mobile canvas touch
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const minSwipeDist = 20;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipeDist) {
        handleInputDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT);
      }
    } else {
      if (Math.abs(dy) > minSwipeDist) {
        handleInputDirection(dy > 0 ? Direction.DOWN : Direction.UP);
      }
    }
    touchStartRef.current = null;
  };

  const canvasWidth = MAP_COLS * TILE_SIZE; // 504px
  const canvasHeight = MAP_ROWS * TILE_SIZE; // 558px

  return (
    <main
      ref={containerRef}
      tabIndex={0}
      className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col items-center justify-start p-2 sm:p-4 select-none outline-none focus:outline-none"
    >
      {/* Top Title & Quick Subtitle */}
      <header className="w-full max-w-xl flex items-center justify-between py-1 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
          <h1 className="font-arcade text-sm sm:text-base text-yellow-400 tracking-wider">
            PAC-MAN
          </h1>
        </div>
        <span className="text-[10px] sm:text-xs font-mono text-neutral-400">
          PYGAME ARCADE EDITION
        </span>
      </header>

      {/* Arcade Cabinet Container */}
      <div className="w-full max-w-xl flex flex-col items-center bg-[#0d1117] border-2 sm:border-4 border-blue-600/60 rounded-2xl p-2 sm:p-3 shadow-[0_0_50px_rgba(37,99,235,0.25)]">
        {/* Marquee & Score Board */}
        <ArcadeMarquee
          score={score}
          highScore={highScore}
          lives={lives}
          level={level}
        />

        {/* Screen Bezel & Canvas Area */}
        <div
          className={`relative w-full max-w-[504px] aspect-[504/558] mx-auto bg-black rounded-lg overflow-hidden border-2 border-neutral-800 shadow-2xl cursor-pointer ${
            crtEnabled ? 'crt-scanlines crt-screen' : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            // Clicking canvas also starts or wakes up input
            containerRef.current?.focus();
          }}
        >
          <canvas
            id="pacman-canvas"
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full object-contain block image-rendering-pixelated"
          />
        </div>

        {/* Arcade Action Controls & D-Pad */}
        <ArcadeControls
          onDirection={handleInputDirection}
          onTogglePause={togglePause}
          onRestart={restart}
          onToggleMute={toggleMute}
          onToggleCrt={toggleCrt}
          onOpenPygameModal={() => setIsPygameModalOpen(true)}
          onSelectSpeedPreset={applySpeedPreset}
          gameState={gameState}
          isMuted={isMuted}
          crtEnabled={crtEnabled}
          speedPreset={speedPreset}
          activeKeyDir={activeKeyDir}
        />
      </div>

      {/* Pygame Code Viewer Modal */}
      <PygameCodeModal
        isOpen={isPygameModalOpen}
        onClose={() => setIsPygameModalOpen(false)}
      />
    </main>
  );
}
