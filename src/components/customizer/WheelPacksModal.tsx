import React, { useState, useRef } from 'react';
import { WheelPack, RadialItem, RadialSettings, ContextProfile } from '../../types/radial';
import { WHEEL_PACKS } from '../../data/wheelPacks';
import { X, Package, Download, Upload, Check, Sparkles, Terminal, Palette, Zap, Compass, Globe } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface WheelPacksModalProps {
  isOpen: boolean;
  currentSettings: RadialSettings;
  currentMenuItems: RadialItem[];
  onClose: () => void;
  onApplyPack: (pack: WheelPack) => void;
  onUpdateSettings: (settings: RadialSettings) => void;
  onImportMenuItems: (items: RadialItem[]) => void;
}

export const WheelPacksModal: React.FC<WheelPacksModalProps> = ({
  isOpen,
  currentSettings,
  currentMenuItems,
  onClose,
  onApplyPack,
  onUpdateSettings,
  onImportMenuItems,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string>(WHEEL_PACKS[0].id);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activePack = WHEEL_PACKS.find((p) => p.id === selectedPackId) || WHEEL_PACKS[0];

  const handleExportJson = () => {
    const exportData = {
      format: 'radial-access-pack-v2',
      name: currentSettings.customRadialName || 'Custom Radial Pack',
      author: 'User',
      timestamp: new Date().toISOString(),
      settings: currentSettings,
      items: currentMenuItems,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentSettings.customRadialName || 'wheel').toLowerCase().replace(/\s+/g, '_')}.radialpack.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playActionChime(true);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.items)) {
          onImportMenuItems(parsed.items);
          if (parsed.settings) {
            onUpdateSettings({ ...currentSettings, ...parsed.settings });
          }
          soundManager.playActionChime(true);
          setCopiedStatus('Imported successfully!');
          setTimeout(() => setCopiedStatus(null), 2500);
        } else if (Array.isArray(parsed)) {
          onImportMenuItems(parsed);
          soundManager.playActionChime(true);
          setCopiedStatus('Imported menu items!');
          setTimeout(() => setCopiedStatus(null), 2500);
        }
      } catch (err) {
        alert('Could not parse JSON file. Ensure valid Radial Access pack structure.');
      }
    };
    reader.readAsText(file);
  };

  const contextIcons: Record<ContextProfile, React.ReactNode> = {
    global: <Compass className="w-3.5 h-3.5" />,
    vscode: <Terminal className="w-3.5 h-3.5" />,
    figma: <Palette className="w-3.5 h-3.5" />,
    premiere: <Zap className="w-3.5 h-3.5" />,
    chrome: <Globe className="w-3.5 h-3.5" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Community Wheel Packs & Context Presets</span>
                <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded font-mono">
                  JSON Presets
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Shareable configurations tailored for Developers, Designers, Video Creators & General Productivity
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Left Pack Selector */}
          <div className="p-4 border-r border-slate-800 bg-slate-950/60 overflow-y-auto space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Curated Packs
            </span>
            {WHEEL_PACKS.map((pack) => {
              const isSelected = pack.id === selectedPackId;
              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500/80 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5"
                    style={{ backgroundColor: pack.accentColor }}
                  >
                    {contextIcons[pack.context]}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white block leading-tight">{pack.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{pack.author}</span>
                  </div>
                </button>
              );
            })}

            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 px-1">
                Custom Pack Actions
              </span>
              <button
                onClick={handleExportJson}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Current (.json)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON Pack</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.radialpack.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* Right Pack Preview */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-sky-400 font-semibold tracking-wider">
                  Preset Profile
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activePack.name}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {activePack.context}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">{activePack.description}</p>
              </div>

              <button
                onClick={() => {
                  onApplyPack(activePack);
                  soundManager.playActionChime(true);
                  onClose();
                }}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply This Pack</span>
              </button>
            </div>

            {copiedStatus && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                <span>{copiedStatus}</span>
              </div>
            )}

            {/* Slots Matrix */}
            <div>
              <span className="text-xs font-semibold text-slate-300 mb-2 block">
                Fixed Sectors Layout (Preserves Muscle Memory):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activePack.items.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-sky-400 font-bold">{slot.directionHint}</span>
                      <span className="text-[9px] text-slate-500 font-mono">Slot {index + 1}</span>
                    </div>
                    <span className="font-semibold text-xs text-white line-clamp-1">{slot.label}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{slot.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Context sensor note */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
              <strong className="text-slate-200">Native Windows Companion Sync:</strong>
              <p>
                In the native desktop background app (`python-native/main.py`), active window detection automatically matches foreground apps (e.g., <code className="text-sky-300 font-mono">code.exe</code> activates Developer Pack, <code className="text-sky-300 font-mono">figma.exe</code> activates Designer Pack).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
