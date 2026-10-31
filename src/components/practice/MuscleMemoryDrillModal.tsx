import React, { useState, useEffect, useRef } from 'react';
import { RadialItem } from '../../types/radial';
import { X, Target, Zap, RotateCcw, Trophy, CheckCircle2, Compass, Award, ArrowUpRight } from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { getPointerPolar } from '../../utils/radialMath';

interface MuscleMemoryDrillModalProps {
  isOpen: boolean;
  items: RadialItem[];
  onClose: () => void;
  onOpenRadialForPractice: () => void;
}

const DIRECTION_NAMES = [
  'North (↑ 12:00)',
  'North-East (↗ 1:30)',
  'East (→ 3:00)',
  'South-East (↘ 4:30)',
  'South (↓ 6:00)',
  'South-West (↙ 7:30)',
  'West (← 9:00)',
  'North-West (↖ 10:30)',
];

export const MuscleMemoryDrillModal: React.FC<MuscleMemoryDrillModalProps> = ({
  isOpen,
  items,
  onClose,
  onOpenRadialForPractice,
}) => {
  const flatItems = items.filter((it) => it.type !== 'sub_menu');
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [lastTimeMs, setLastTimeMs] = useState<number | null>(null);
  const [lastRank, setLastRank] = useState<'S' | 'A' | 'B' | 'C' | null>(null);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [isFlicking, setIsFlicking] = useState<boolean>(false);
  const [flickFeedback, setFlickFeedback] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const startCoordRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const totalSectors = flatItems.length || 8;
  const currentTarget = flatItems[targetIndex] || flatItems[0];
  const targetAngle = (targetIndex * (360 / totalSectors)) % 360;
  const directionName = totalSectors === 8 ? DIRECTION_NAMES[targetIndex] : `${Math.round(targetAngle)}°`;

  const spawnNextTarget = () => {
    if (flatItems.length === 0) return;
    let nextIdx = Math.floor(Math.random() * flatItems.length);
    if (flatItems.length > 1 && nextIdx === targetIndex) {
      nextIdx = (nextIdx + 1) % flatItems.length;
    }
    setTargetIndex(nextIdx);
    setStartTime(Date.now());
    setIsFlicking(false);
    setFlickFeedback(null);
  };

  useEffect(() => {
    if (isOpen) {
      spawnNextTarget();
    }
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    startCoordRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setIsFlicking(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFlicking) return;
    setIsFlicking(false);

    const dx = e.clientX - startCoordRef.current.x;
    const dy = e.clientY - startCoordRef.current.y;
    const { distance, angleDegrees } = getPointerPolar(dx, dy);

    if (distance < 35) {
      setFlickFeedback('Flick farther outward from the center!');
      return;
    }

    const elapsed = Date.now() - startTime;
    setLastTimeMs(elapsed);

    // Angular error
    let diff = Math.abs(angleDegrees - targetAngle);
    if (diff > 180) diff = 360 - diff;

    const sectorTolerance = 360 / totalSectors / 1.5;
    const isSuccess = diff <= sectorTolerance;

    if (isSuccess) {
      soundManager.playActionChime(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (bestTimeMs === null || elapsed < bestTimeMs) {
        setBestTimeMs(elapsed);
      }

      let rank: 'S' | 'A' | 'B' | 'C' = 'C';
      if (elapsed < 160) rank = 'S';
      else if (elapsed < 260) rank = 'A';
      else if (elapsed < 380) rank = 'B';
      setLastRank(rank);

      setFlickFeedback(`Hit! ${elapsed}ms (${rank}-Rank)`);
      setTimeout(spawnNextTarget, 700);
    } else {
      soundManager.playCloseSound();
      setStreak(0);
      setLastRank('C');
      setFlickFeedback(`Missed angle by ${Math.round(diff)}°. Direction: ${directionName}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-center">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Target className="w-4 h-4 text-orange-400" />
            <span>Marking Menu Reflex Trainer</span>
            <span className="text-[10px] bg-orange-950 text-orange-400 border border-orange-800/80 px-1.5 py-0.2 rounded font-mono">
              Fitts Law
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-xs text-slate-400 mb-4 max-w-sm">
            Kurtenbach & Buxton (1993) proved that marking menus become ballistic muscle memory after 20 reps. Press down on the pad and flick swiftly toward the target vector!
          </p>

          {/* Current Target Card */}
          <div className="w-full p-4 rounded-xl bg-slate-950 border border-orange-500/40 flex items-center justify-between shadow-lg mb-4">
            <div className="text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 block mb-0.5">
                Target Action
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span>{currentTarget?.label || 'Action'}</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Fixed Vector</span>
              <span className="text-sm font-bold text-sky-400 font-mono flex items-center justify-end gap-1">
                <Compass className="w-3.5 h-3.5" />
                <span>{directionName}</span>
              </span>
            </div>
          </div>

          {/* Interactive Flick Arena Radar */}
          <div
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="w-44 h-44 rounded-full bg-slate-950 border border-slate-700/80 hover:border-orange-500/60 relative cursor-crosshair select-none flex items-center justify-center shadow-inner touch-none mb-4 transition-all"
            title="Press center and flick mouse in the target direction"
          >
            {/* Compass Axes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-full h-[1px] bg-white" />
              <div className="h-full w-[1px] bg-white absolute" />
            </div>

            {/* Target Direction Highlight Beam */}
            <div
              className="absolute w-20 h-2 bg-gradient-to-r from-orange-500/20 to-orange-400 rounded-full pointer-events-none transform origin-left"
              style={{
                left: '50%',
                top: 'calc(50% - 4px)',
                transform: `rotate(${targetAngle - 90}deg)`,
              }}
            />

            {/* Center Pad */}
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-orange-400/80 flex flex-col items-center justify-center pointer-events-none shadow-md z-10">
              <span className="text-[9px] font-bold text-orange-300 font-mono">FLICK</span>
            </div>

            {/* Target Dot */}
            <div
              className="absolute w-5 h-5 rounded-full bg-orange-500 border border-white flex items-center justify-center text-[9px] text-white font-bold shadow-lg pointer-events-none animate-pulse"
              style={{
                left: `calc(50% + ${Math.cos(((targetAngle - 90) * Math.PI) / 180) * 70}px - 10px)`,
                top: `calc(50% + ${Math.sin(((targetAngle - 90) * Math.PI) / 180) * 70}px - 10px)`,
              }}
            >
              ✦
            </div>
          </div>

          {/* Flick Feedback */}
          {flickFeedback && (
            <div className="text-xs font-semibold mb-3 animate-in fade-in">
              <span className={lastRank === 'S' || lastRank === 'A' ? 'text-emerald-400' : 'text-orange-400'}>
                {flickFeedback}
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 w-full mb-4">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 block">Reaction</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {lastTimeMs !== null ? `${lastTimeMs}ms` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 block">Rank</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {lastRank ? `${lastRank}-Tier` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 block">Personal Best</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {bestTimeMs !== null ? `${bestTimeMs}ms` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 block">Streak</span>
              <span className="text-sm font-bold text-rose-400 font-mono">{streak} 🔥</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => {
                onClose();
                onOpenRadialForPractice();
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Test on Live Wheel</span>
            </button>
            <button
              onClick={spawnNextTarget}
              className="px-3 py-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs"
              title="Next Target"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950 text-[10px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>S-Rank: &lt;160ms · Human Eye Gaze: ~320ms</span>
          </div>
          <span className="font-mono text-slate-500">Kurtenbach & Buxton 1993</span>
        </div>
      </div>
    </div>
  );
};
