import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  PenTool,
  Palette,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

// ---------------- CALCULATOR MODAL ----------------
interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleInput = (val: string) => {
    soundManager.playHoverTick(0);
    setExpr((prev) => prev + val);
  };

  const handleClear = () => {
    soundManager.playHoverTick(1);
    setExpr('');
    setResult('');
  };

  const handleBackspace = () => {
    soundManager.playHoverTick(0);
    setExpr((prev) => prev.slice(0, -1));
  };

  const handleEvaluate = () => {
    try {
      // Safe sanitized arithmetic evaluation using Function
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const res = Function(`"use strict"; return (${sanitized})`)();
      const formatted = Number.isInteger(res) ? res.toString() : Number(res).toFixed(4).replace(/\.?0+$/, '');
      setResult(formatted);
      setHistory((prev) => [`${expr} = ${formatted}`, ...prev.slice(0, 9)]);
      soundManager.playActionChime(true);
    } catch {
      setResult('Error');
      soundManager.playActionChime(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Calculator className="w-4 h-4 text-sky-400" />
            <span>Radial Calculator</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-950 flex flex-col justify-end text-right border-b border-slate-800 h-28">
          <span className="text-xs text-slate-400 font-mono tracking-wider overflow-x-auto whitespace-nowrap mb-1">
            {expr || '0'}
          </span>
          <span className="text-2xl font-bold text-white font-mono">{result || '0'}</span>
        </div>

        {/* Buttons Grid */}
        <div className="p-4 grid grid-cols-4 gap-2 bg-slate-900">
          {['C', '(', ')', '÷'].map((btn) => (
            <button
              key={btn}
              onClick={() => (btn === 'C' ? handleClear() : handleInput(btn))}
              className="h-10 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/50"
            >
              {btn}
            </button>
          ))}
          {['7', '8', '9', '×'].map((btn) => (
            <button
              key={btn}
              onClick={() => handleInput(btn)}
              className={`h-10 text-xs font-semibold rounded-lg ${
                btn === '×'
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/50'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-white'
              }`}
            >
              {btn}
            </button>
          ))}
          {['4', '5', '6', '-'].map((btn) => (
            <button
              key={btn}
              onClick={() => handleInput(btn)}
              className={`h-10 text-xs font-semibold rounded-lg ${
                btn === '-'
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/50'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-white'
              }`}
            >
              {btn}
            </button>
          ))}
          {['1', '2', '3', '+'].map((btn) => (
            <button
              key={btn}
              onClick={() => handleInput(btn)}
              className={`h-10 text-xs font-semibold rounded-lg ${
                btn === '+'
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/50'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-white'
              }`}
            >
              {btn}
            </button>
          ))}
          <button
            onClick={() => handleInput('0')}
            className="h-10 text-xs font-semibold rounded-lg bg-slate-800/60 hover:bg-slate-800 text-white"
          >
            0
          </button>
          <button
            onClick={() => handleInput('.')}
            className="h-10 text-xs font-semibold rounded-lg bg-slate-800/60 hover:bg-slate-800 text-white"
          >
            .
          </button>
          <button
            onClick={handleBackspace}
            className="h-10 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            ⌫
          </button>
          <button
            onClick={handleEvaluate}
            className="h-10 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-900/40"
          >
            =
          </button>
        </div>

        {/* Mini History log */}
        {history.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 text-[10px] text-slate-400 max-h-20 overflow-y-auto font-mono">
            {history.map((h, i) => (
              <div key={i} className="truncate">
                {h}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- QUICK NOTES / SCRATCHPAD MODAL ----------------
interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notesText: string;
  onSaveNotes: (text: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, notesText, onSaveNotes }) => {
  const [content, setContent] = useState(notesText);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(notesText);
  }, [notesText]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    soundManager.playActionChime(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveNotes(content);
    soundManager.playActionChime(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <PenTool className="w-4 h-4 text-emerald-400" />
            <span>Radial Quick Notes</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Copy all notes"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture your thoughts, ideas, or quick clipboard contents here..."
          className="w-full h-64 p-4 font-mono text-xs bg-slate-950 text-slate-100 resize-none focus:outline-none border-none leading-relaxed"
          autoFocus
        />

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {content.trim() ? content.trim().split(/\s+/).length : 0} words · {content.length} characters
          </span>
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- COLOR LAB & PALETTE MODAL ----------------
interface ColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({ isOpen, onClose }) => {
  const [selectedHex, setSelectedHex] = useState('#38bdf8');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  if (!isOpen) return null;

  // Convert Hex to RGB
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const rgb = hexToRgb(selectedHex);
  const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  const samplePalette = [
    '#38bdf8',
    '#0284c7',
    '#fbbf24',
    '#d97706',
    '#a855f7',
    '#7c3aed',
    '#10b981',
    '#059669',
    '#f43f5e',
    '#e11d48',
    '#f97316',
    '#ea580c',
    '#64748b',
    '#334155',
    '#ffffff',
    '#09090b',
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    soundManager.playActionChime(true);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Palette className="w-4 h-4 text-fuchsia-400" />
            <span>Radial Color Lab</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Color Preview Block */}
        <div
          className="h-28 flex items-end p-4 transition-colors"
          style={{ backgroundColor: selectedHex }}
        >
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center justify-between w-full text-white text-xs font-mono">
            <span>{selectedHex.toUpperCase()}</span>
            <span className="text-[10px] text-slate-300">{rgbString}</span>
          </div>
        </div>

        {/* Native Color Picker & Quick formats */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={selectedHex}
              onChange={(e) => setSelectedHex(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
            />
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => copyToClipboard(selectedHex.toUpperCase())}
                className="flex-1 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-1 font-mono"
              >
                {copiedColor === selectedHex.toUpperCase() ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy HEX</span>
              </button>
              <button
                onClick={() => copyToClipboard(rgbString)}
                className="flex-1 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-1 font-mono"
              >
                {copiedColor === rgbString ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy RGB</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 mb-2 block">Quick Swatches</span>
            <div className="grid grid-cols-8 gap-2">
              {samplePalette.map((col) => (
                <button
                  key={col}
                  onClick={() => {
                    setSelectedHex(col);
                    soundManager.playHoverTick(0);
                  }}
                  className="w-full aspect-square rounded-md transition-transform hover:scale-110 shadow-sm"
                  style={{
                    backgroundColor: col,
                    border: selectedHex === col ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- FOCUS / POMODORO TIMER MODAL ----------------
interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ isOpen, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      soundManager.playActionChime(true);
      if (mode === 'work') {
        setMode('break');
        setSecondsLeft(5 * 60);
      } else {
        setMode('work');
        setSecondsLeft(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, mode]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = mode === 'work' ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'work' ? 25 * 60 : 5 * 60);
    soundManager.playHoverTick(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-center">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Radial Focus Timer</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-800 rounded-lg mb-6">
            <button
              onClick={() => {
                setMode('work');
                setSecondsLeft(25 * 60);
                setIsRunning(false);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'work' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              25m Focus
            </button>
            <button
              onClick={() => {
                setMode('break');
                setSecondsLeft(5 * 60);
                setIsRunning(false);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'break' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              5m Break
            </button>
          </div>

          {/* Circular Visual & Digital Timer */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="6"
                className="text-amber-500 transition-all duration-300"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - progressPercent / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold font-mono text-white">{timeFormatted}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{mode}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsRunning(!isRunning);
                soundManager.playActionChime(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isRunning
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </button>
            <button
              onClick={resetTimer}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- TEXT TRANSFORMER & STRING TOOL MODAL ----------------
interface TextTransformerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onApplyText?: (transformed: string) => void;
}

export const TextTransformerModal: React.FC<TextTransformerModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  onApplyText,
}) => {
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  if (!isOpen) return null;

  const transform = (action: string) => {
    let result = text;
    switch (action) {
      case 'upper':
        result = text.toUpperCase();
        break;
      case 'lower':
        result = text.toLowerCase();
        break;
      case 'title':
        result = text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'slug':
        result = text
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        break;
      case 'json_prettify':
        try {
          result = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          // ignore
        }
        break;
      case 'base64_encode':
        try {
          result = btoa(text);
        } catch {
          // ignore
        }
        break;
      case 'base64_decode':
        try {
          result = atob(text);
        } catch {
          // ignore
        }
        break;
    }
    setText(result);
    soundManager.playActionChime(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundManager.playActionChime(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyText) {
      onApplyText(text);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Radial Text Transformer</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-wrap gap-1.5 border-b border-slate-800 bg-slate-900/60">
          <button
            onClick={() => transform('upper')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700"
          >
            UPPERCASE
          </button>
          <button
            onClick={() => transform('lower')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700"
          >
            lowercase
          </button>
          <button
            onClick={() => transform('title')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700"
          >
            Title Case
          </button>
          <button
            onClick={() => transform('slug')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700"
          >
            kebab-slug
          </button>
          <button
            onClick={() => transform('json_prettify')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-md border border-slate-700"
          >
            Prettify JSON
          </button>
          <button
            onClick={() => transform('base64_encode')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700"
          >
            Base64 Enc
          </button>
          <button
            onClick={() => transform('base64_decode')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700"
          >
            Base64 Dec
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text to transform..."
          className="w-full h-56 p-4 font-mono text-xs bg-slate-950 text-slate-100 resize-none focus:outline-none border-none leading-relaxed"
        />

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Text</span>
          </button>
          {onApplyText && (
            <button
              onClick={handleApply}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg shadow-sm"
            >
              Insert into Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
