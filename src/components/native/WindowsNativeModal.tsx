import React, { useState } from 'react';
import { RadialItem, RadialSettings, UserFolder } from '../../types/radial';
import {
  X,
  Download,
  Copy,
  Check,
  Terminal,
  FileCode,
  Package,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Monitor,
  Flame,
} from 'lucide-react';

interface WindowsNativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RadialSettings;
  menuItems: RadialItem[];
  folders: UserFolder[];
}

export const WindowsNativeModal: React.FC<WindowsNativeModalProps> = ({
  isOpen,
  onClose,
  settings,
  menuItems,
  folders,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'config' | 'run_bat' | 'build_bat' | 'main_py'>('guide');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  // Convert web radial configuration into Python native config.json format
  const generateNativeConfig = () => {
    // Map web items into python config items
    const mapItems = (items: RadialItem[]): any[] => {
      return items.map((item) => {
        let type = 'command';
        let payload = '';

        if (item.type === 'sub_menu') {
          type = 'sub_menu';
        } else if (item.type === 'folder') {
          type = 'folder';
          payload = 'explorer';
        } else if (item.toolId === 'calculator') {
          type = 'system';
          payload = 'calc';
        } else if (item.toolId === 'notes') {
          type = 'system';
          payload = 'notepad';
        } else if (item.toolId === 'timer') {
          type = 'command';
          payload = 'start ms-clock:';
        } else if (item.toolId === 'formatter') {
          type = 'command';
          payload = 'notepad.exe';
        } else if (item.customPayload?.startsWith('http')) {
          type = 'url';
          payload = item.customPayload;
        } else if (item.customPayload) {
          type = 'command';
          payload = item.customPayload;
        } else {
          type = 'system';
          payload = 'calc';
        }

        const mapped: any = {
          id: item.id,
          label: item.label,
          icon: item.icon ? '✦' : '•',
          color: item.color || '#0284c7',
          type,
          payload,
          description: item.description || item.label,
        };

        if (item.children && item.children.length > 0) {
          mapped.children = mapItems(item.children);
        }

        return mapped;
      });
    };

    const nativeJson = {
      settings: {
        app_name: settings.customRadialName || 'Radial Access',
        tagline: settings.customRadialTagline || 'Native Windows Quick Launcher',
        hotkey: '<alt>+<space>',
        outer_radius: settings.outerRadius || 170,
        inner_radius: settings.innerRadius || 62,
        center_deadzone: settings.centerDeadzone || 38,
        theme: {
          background: '#0b0f19',
          background_alpha: 240,
          slice_default: '#131b2e',
          slice_hover: '#1e293b',
          accent_color: '#0284c7',
          accent_secondary: '#6366f1',
          text_primary: '#f8fafc',
          text_secondary: '#94a3b8',
          border_color: '#334155',
        },
        flick_gestures_enabled: settings.flickGestureEnabled ?? true,
        flick_threshold_speed: settings.flickSensitivity === 'high' ? 350.0 : settings.flickSensitivity === 'relaxed' ? 600.0 : 450.0,
        flick_min_distance: 50,
        close_on_action: true,
        sound_enabled: settings.soundEnabled ?? true,
      },
      items: mapItems(menuItems),
    };

    return JSON.stringify(nativeJson, null, 2);
  };

  const configContent = generateNativeConfig();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([configContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runBatCode = `@echo off
title Radial Access - Native Windows Launcher
cd /d "%~dp0"

echo [*] Checking Python...
where python >nul 2>nul || (echo [ERROR] Python 3 not found in PATH! & pause & exit /b 1)

echo [*] Installing dependencies (PyQt6, pynput)...
pip install -r requirements.txt --quiet

echo [*] Starting Radial Access Native Overlay...
echo [*] Global Hotkey: Alt+Space
python main.py
`;

  const buildBatCode = `@echo off
title Radial Access - Build Windows Executable (.exe)
cd /d "%~dp0"

pip install pyinstaller PyQt6 pynput --quiet
echo [*] Compiling single-file native executable...

pyinstaller --noconsole ^
            --onefile ^
            --name "RadialAccess" ^
            --add-data "config.json;." ^
            --clean ^
            main.py

echo.
echo SUCCESS! Your standalone executable is located at:
echo dist\\RadialAccess.exe
pause
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Radial Access for Windows (Python Native)
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PyQt6 + Windows Desktop
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Run natively on your Windows PC outside the browser with global hotkey & gestures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/30 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Setup & Run Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export config.json</span>
          </button>
          <button
            onClick={() => setActiveTab('run_bat')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'run_bat'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>run.bat</span>
          </button>
          <button
            onClick={() => setActiveTab('build_bat')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'build_bat'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span>build_exe.bat</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-900 border border-sky-800/60 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">All Python files have been added to your project:</span> Check the <code className="text-sky-300 font-mono bg-sky-950 px-1 py-0.5 rounded border border-sky-800">python-native/</code> directory in your cloned repo for <code className="text-slate-200">main.py</code>, <code className="text-slate-200">config.json</code>, <code className="text-slate-200">run.bat</code>, and <code className="text-slate-200">build_exe.bat</code>.
                </div>
              </div>

              {/* 3 Simple Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h3 className="text-xs font-semibold text-white">1-Click Launch</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Double-click <code className="text-sky-300 font-mono">python-native\run.bat</code> on your Windows PC. It checks Python and launches immediately.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h3 className="text-xs font-semibold text-white">Global Hotkey & Flick</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-300 font-mono text-[10px]">Alt + Space</kbd> anywhere in Windows! The wheel spawns directly at your cursor tip. Flick or click to trigger.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h3 className="text-xs font-semibold text-white">Build Standalone .EXE</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Double-click <code className="text-purple-300 font-mono">python-native\build_exe.bat</code> to compile into <code className="text-slate-200">dist\RadialAccess.exe</code>.
                  </p>
                </div>
              </div>

              {/* Native Windows Capabilities */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>Native Windows Capabilities Included</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Launches any Windows .EXE program or shortcut</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Opens folders directly in Windows File Explorer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Fires commands in PowerShell / Windows Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full sub-menu folder drilldown with Back button</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>System tray icon with quick settings & config reload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Runs silently with 0% idle CPU footprint</span>
                  </div>
                </div>
              </div>

              {/* Run on Startup Guide */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">Run Automatically on Windows Boot</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  1. Press <kbd className="px-1 py-0.2 bg-slate-800 rounded font-mono text-[10px]">Win + R</kbd>, type <code className="text-sky-300 font-mono">shell:startup</code> and hit Enter.
                  <br />
                  2. Create a shortcut to <code className="text-slate-200 font-mono">RadialAccess.exe</code> (or <code className="text-slate-200 font-mono">run.bat</code>) and paste it into the Startup folder!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Live config.json Exporter</h3>
                  <p className="text-[11px] text-slate-400">
                    Matches your current web radial items and customized settings.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(configContent, 'config')}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copied === 'config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'config' ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadConfig}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white flex items-center gap-1.5 shadow transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download config.json</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[420px] leading-relaxed">
                  {configContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'run_bat' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">run.bat (Windows Launcher Script)</h3>
                  <p className="text-[11px] text-slate-400">
                    Double-click in your <code className="text-sky-300">python-native/</code> folder on Windows to start.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(runBatCode, 'run_bat')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {copied === 'run_bat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'run_bat' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed">
                {runBatCode}
              </pre>
            </div>
          )}

          {activeTab === 'build_bat' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">build_exe.bat (PyInstaller Compiler)</h3>
                  <p className="text-[11px] text-slate-400">
                    Compiles a standalone, single-file <code className="text-purple-300">RadialAccess.exe</code>.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(buildBatCode, 'build_bat')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {copied === 'build_bat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'build_bat' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-purple-400 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed">
                {buildBatCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Python directory: <code className="text-sky-300 font-mono bg-slate-900 px-1 py-0.5 rounded border border-slate-800">/python-native</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
