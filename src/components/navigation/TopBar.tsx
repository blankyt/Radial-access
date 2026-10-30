import React from 'react';
import { RadialSettings } from '../../types/radial';
import {
  Compass,
  FolderOpen,
  Volume2,
  VolumeX,
  Target,
  Sliders,
  Sparkles,
  Monitor,
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface TopBarProps {
  filesCount: number;
  settings: RadialSettings;
  onUpdateSettings: (s: RadialSettings) => void;
  onOpenFilesHub: () => void;
  onOpenDrill: () => void;
  onOpenCustomizer: () => void;
  onOpenWindowsNative: () => void;
  onTriggerRadialCenter: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  filesCount,
  settings,
  onUpdateSettings,
  onOpenFilesHub,
  onOpenDrill,
  onOpenCustomizer,
  onOpenWindowsNative,
  onTriggerRadialCenter,
}) => {
  const toggleSound = () => {
    const nextState = !settings.soundEnabled;
    soundManager.enabled = nextState;
    onUpdateSettings({ ...settings, soundEnabled: nextState });
    if (nextState) soundManager.playHoverTick(0);
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 overflow-hidden">
          {settings.customRadialLogoUrl ? (
            <img
              src={settings.customRadialLogoUrl}
              alt="Radial Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <Compass className="w-4 h-4 animate-spin-slow" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm text-white tracking-tight">
              {settings.customRadialName || 'Radial Access'}
            </h1>
            <span className="text-[10px] text-sky-400 font-mono bg-sky-950/80 border border-sky-800/80 px-1.5 py-0.2 rounded">
              v2.5
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {settings.customRadialTagline || 'Radial Shortcut & File Interface'}
          </p>
        </div>
      </div>

      {/* Center Summon Quick Action */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onTriggerRadialCenter}
          className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-sky-950/50 flex items-center gap-2 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Summon Radial Menu</span>
          <kbd className="px-1 py-0.2 bg-black/30 rounded text-[9px] font-mono">Right-Click / Space</kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Windows Native (Python) Button */}
        <button
          onClick={onOpenWindowsNative}
          className="px-3 py-1.5 rounded-lg border border-sky-800/80 bg-sky-950/60 hover:bg-sky-900/60 text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:border-sky-700"
          title="Run natively on Windows using Python / PyQt6"
        >
          <Monitor className="w-3.5 h-3.5 text-sky-400" />
          <span>Windows App (Python)</span>
          <span className="text-[9px] bg-sky-500/20 text-sky-300 font-mono px-1 py-0.2 rounded border border-sky-500/30">
            Native
          </span>
        </button>

        {/* Files Hub Button */}
        <button
          onClick={onOpenFilesHub}
          className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Manage & select your custom files"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>My Files</span>
          <span className="text-[10px] text-sky-400 font-mono ml-0.5">({filesCount})</span>
        </button>

        {/* Speed Drill */}
        <button
          onClick={onOpenDrill}
          className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Practice radial flick reflexes"
        >
          <Target className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline">Speed Drill</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-lg border transition-colors ${
            settings.soundEnabled
              ? 'border-slate-800 bg-slate-900/60 text-sky-400 hover:bg-slate-800'
              : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-400'
          }`}
          title={settings.soundEnabled ? 'Mute Audio Ticks' : 'Enable Acoustic Feedback'}
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenCustomizer}
          className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Radial Preferences & Customizer"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
