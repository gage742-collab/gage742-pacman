import React from 'react';
import { FRUITS } from '../game/constants';

interface ArcadeMarqueeProps {
  score: number;
  highScore: number;
  lives: number;
  level: number;
}

export const ArcadeMarquee: React.FC<ArcadeMarqueeProps> = ({
  score,
  highScore,
  lives,
  level,
}) => {
  const currentFruit = FRUITS[Math.min(level - 1, FRUITS.length - 1)];

  return (
    <div className="w-full max-w-xl mx-auto px-2 pt-2 pb-1">
      {/* Arcade Score Header */}
      <div className="flex items-start justify-between font-arcade text-xs sm:text-sm tracking-wider uppercase mb-1">
        {/* 1UP */}
        <div className="flex flex-col items-start">
          <span className="text-red-500 font-bold mb-0.5">1UP</span>
          <span className="text-white text-sm sm:text-base font-bold">
            {score.toString().padStart(2, '0')}
          </span>
        </div>

        {/* HIGH SCORE */}
        <div className="flex flex-col items-center">
          <span className="text-red-500 font-bold mb-0.5">HIGH SCORE</span>
          <span className="text-white text-sm sm:text-base font-bold">
            {highScore.toString().padStart(2, '0')}
          </span>
        </div>

        {/* LEVEL */}
        <div className="flex flex-col items-end">
          <span className="text-cyan-400 font-bold mb-0.5">LVL</span>
          <span className="text-white text-sm sm:text-base font-bold">
            {level}
          </span>
        </div>
      </div>

      {/* Lives and Fruit Bar */}
      <div className="flex items-center justify-between px-1 py-1 border-b border-blue-900/50">
        {/* Lives (Pacman Icons) */}
        <div className="flex items-center gap-1.5" title={`${lives} Lives remaining`}>
          {Array.from({ length: Math.max(0, lives) }).map((_, idx) => (
            <div
              key={idx}
              className="w-4 h-4 rounded-full bg-yellow-400 relative overflow-hidden flex items-center justify-center shadow-xs"
            >
              {/* Mouth wedge cutout */}
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-r-[5px] border-r-[#0b0c10]"
              />
            </div>
          ))}
          {lives <= 0 && (
            <span className="font-arcade text-[10px] text-red-500">NO LIVES</span>
          )}
        </div>

        {/* Level Fruit */}
        <div className="flex items-center gap-1.5" title={`Level ${level} Fruit: ${currentFruit.name} (+${currentFruit.points} pts)`}>
          <span className="text-base">{currentFruit.symbol}</span>
          <span className="font-arcade text-[10px] text-yellow-300">
            {currentFruit.points}
          </span>
        </div>
      </div>
    </div>
  );
};
