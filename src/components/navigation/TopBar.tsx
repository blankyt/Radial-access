import React from 'react';
import { RadialSettings, ContextProfile } from '../../types/radial';
import {
  Compass,
  FolderOpen,
  Volume2,
  VolumeX,
  Target,
  Sliders,
  Sparkles,
  Monitor,
  Package,
  Clock,
  Eye,
  ShieldCheck,
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
  onOpenBenchmark: () => void;
  onOpenPacks: () => void;
  onTriggerRadialCenter: () => void;
  onSwitchContext: (context: ContextProfile) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  filesCount,
  settings,
  onUpdateSettings,
  onOpenFilesHub,
  onOpenDrill,
  onOpenCustomizer,
  onOpenWindowsNative,
  onOpenBenchmark,
  onOpenPacks,
  onTriggerRadialCenter,
  onSwitchContext,
}) => {
  const toggleSound = () => {
    const nextState = !settings.soundEnabled;
    soundManager.enabled = nextState;
    onUpdateSettings({ ...settings, soundEnabled: nextState });
    if (nextState) soundManager.playHoverTick(0);
  };

  const toggleHighContrast = () => {
    const nextMode = !settings.highContrastMode;
    onUpdateSettings({
      ...settings,
      highContrastMode: nextMode,
      theme: nextMode ? 'high_contrast' : 'obsidian',
    });
  };

  const contexts: { id: ContextProfile; label: string; icon: string }[] = [
    { id: 'global', label: 'Global (Default)', icon: '🌐' },
    { id: 'vscode', label: 'VS Code', icon: '⚡' },
    { id: 'figma', label: 'Figma', icon: '🎨' },
    { id: 'premiere', label: 'Premiere', icon: '🎬' },
  ];

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
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
              v2.8
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            {settings.customRadialTagline || 'Zero-Friction Marking Menu & Quick Launcher'}
          </p>
        </div>
      </div>

      {/* Center Context Switcher Simulator */}
      <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-400 px-2 font-semibold">Active Context:</span>
        {contexts.map((ctx) => {
          const isActive = settings.activeContext === ctx.id;
          return (
            <button
              key={ctx.id}
              onClick={() => onSwitchContext(ctx.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{ctx.icon}</span>
              <span>{ctx.label}</span>
            </button>
          );
        })}
      </div>

      {/* Center Summon Quick Action */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onTriggerRadialCenter}
          className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-sky-950/50 flex items-center gap-2 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Summon Radial</span>
          <kbd className="px-1 py-0.2 bg-black/30 rounded text-[9px] font-mono">Middle-Click / Space</kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Wheel Packs */}
        <button
          onClick={onOpenPacks}
          className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Community Wheel Packs & JSON Import/Export"
        >
          <Package className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Packs</span>
        </button>

        {/* Benchmarks & Science */}
        <button
          onClick={onOpenBenchmark}
          className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Speed proof benchmarks, Fitts's law citation, & competitor matrix"
        >
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Speed Proof</span>
        </button>

        {/* Reflex Drill */}
        <button
          onClick={onOpenDrill}
          className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Practice radial flick reflexes & muscle memory"
        >
          <Target className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline">Trainer</span>
        </button>

        {/* Windows Native (Python) Button */}
        <button
          onClick={onOpenWindowsNative}
          className="px-3 py-1.5 rounded-lg border border-sky-800/80 bg-sky-950/60 hover:bg-sky-900/60 text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:border-sky-700"
          title="Run natively on Windows using Python / PyQt6 background daemon"
        >
          <Monitor className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Windows .exe</span>
          <span className="text-[9px] bg-sky-500/20 text-sky-300 font-mono px-1 py-0.2 rounded border border-sky-500/30">
            Native
          </span>
        </button>

        {/* High Contrast Toggle */}
        <button
          onClick={toggleHighContrast}
          className={`p-2 rounded-lg border transition-colors ${
            settings.highContrastMode
              ? 'border-white bg-black text-white'
              : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
          }`}
          title={settings.highContrastMode ? 'Disable High Contrast' : 'Enable High Contrast Mode'}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-lg border transition-colors ${
            settings.soundEnabled
              ? 'border-slate-800 bg-slate-900/60 text-sky-400 hover:bg-slate-800'
              : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-400'
          }`}
          title={settings.soundEnabled ? 'Mute Audio Ticks' : 'Enable Acoustic Feedback (Subtle)'}
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenCustomizer}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="User Settings & Preferences (Ctrl+, or S)"
        >
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="hidden xl:inline">Settings</span>
        </button>
      </div>
    </header>
  );
};
