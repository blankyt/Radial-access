import React, { useState, useEffect, useRef } from 'react';
import { RadialItem } from '../../types/radial';
import { X, Target, Zap, RotateCcw, Trophy, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface MuscleMemoryDrillModalProps {
  isOpen: boolean;
  items: RadialItem[];
  onClose: () => void;
  onOpenRadialForPractice: () => void;
}

export const MuscleMemoryDrillModal: React.FC<MuscleMemoryDrillModalProps> = ({
  isOpen,
  items,
  onClose,
  onOpenRadialForPractice,
}) => {
  const [currentTarget, setCurrentTarget] = useState<RadialItem | null>(null);
  const [drillActive, setDrillActive] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<{ target: string; timeMs: number }[]>([]);
  const targetIndexRef = useRef<number>(0);

  const flatItems = items.filter((it) => it.type !== 'sub_menu');

  const startNextRound = () => {
    if (flatItems.length === 0) return;
    const nextIdx = Math.floor(Math.random() * flatItems.length);
    targetIndexRef.current = nextIdx;
    setCurrentTarget(flatItems[nextIdx]);
    setStartTime(Date.now());
    setDrillActive(true);
    soundManager.playHoverTick(2);
  };

  useEffect(() => {
    if (isOpen) {
      startNextRound();
    } else {
      setDrillActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-center">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Target className="w-4 h-4 text-orange-400" />
            <span>Radial Muscle Memory Arena</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-xs text-slate-400 mb-6">
            Radial menus achieve near-instant execution through muscle memory. Right-click or press Space to flick directly into the target wedge!
          </p>

          {/* Current Target Card */}
          <div className="w-full p-5 rounded-2xl bg-slate-950 border border-orange-500/30 flex flex-col items-center shadow-lg mb-6 relative overflow-hidden">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 mb-1">
              Target Command / File
            </span>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400 animate-pulse" />
              <span>{currentTarget?.label || 'Ready'}</span>
            </h3>
            {currentTarget?.shortcutKey && (
              <span className="text-xs text-slate-400 mt-1 font-mono">
                Key [{currentTarget.shortcutKey}] or Sector Slot
              </span>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">Reaction Time</span>
              <span className="text-base font-bold text-sky-400 font-mono">
                {lastReactionTime !== null ? `${lastReactionTime}ms` : '--'}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">Best Flick</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {bestTime !== null ? `${bestTime}ms` : '--'}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">Streak</span>
              <span className="text-base font-bold text-amber-400 font-mono">{streak} 🔥</span>
            </div>
          </div>

          {/* Practice Action */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => {
                onClose();
                onOpenRadialForPractice();
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Summon Wheel Now</span>
            </button>
            <button
              onClick={startNextRound}
              className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
              title="Next Target"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Average human response: 320ms · Pro radial speed: &lt;180ms</span>
        </div>
      </div>
    </div>
  );
};
