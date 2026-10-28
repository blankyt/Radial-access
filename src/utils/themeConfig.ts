import { RadialTheme } from '../types/radial';

export interface ThemeColors {
  bgApp: string;
  bgCanvas: string;
  bgPanel: string;
  bgHover: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentGlow: string;
  sectorNormal: string;
  sectorHover: string;
  sectorActive: string;
  hubBg: string;
}

export const THEME_CONFIG: Record<RadialTheme, ThemeColors> = {
  obsidian: {
    bgApp: 'bg-slate-950',
    bgCanvas: 'bg-slate-900/60',
    bgPanel: 'bg-slate-900',
    bgHover: 'bg-slate-800',
    border: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    accent: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.35)',
    sectorNormal: 'rgba(15, 23, 42, 0.88)',
    sectorHover: 'rgba(30, 41, 59, 0.96)',
    sectorActive: 'rgba(56, 189, 248, 0.28)',
    hubBg: 'rgba(15, 23, 42, 0.95)',
  },
  cyberpunk: {
    bgApp: 'bg-zinc-950',
    bgCanvas: 'bg-black/80',
    bgPanel: 'bg-zinc-900',
    bgHover: 'bg-zinc-800',
    border: 'border-yellow-500/30',
    textPrimary: 'text-yellow-400',
    textSecondary: 'text-zinc-400',
    accent: '#facc15',
    accentGlow: 'rgba(250, 204, 21, 0.45)',
    sectorNormal: 'rgba(18, 18, 20, 0.92)',
    sectorHover: 'rgba(39, 39, 42, 0.98)',
    sectorActive: 'rgba(250, 204, 21, 0.35)',
    hubBg: 'rgba(9, 9, 11, 0.98)',
  },
  nord: {
    bgApp: 'bg-slate-900',
    bgCanvas: 'bg-slate-950/70',
    bgPanel: 'bg-slate-800',
    bgHover: 'bg-slate-700/80',
    border: 'border-teal-500/20',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    accent: '#2dd4bf',
    accentGlow: 'rgba(45, 212, 191, 0.35)',
    sectorNormal: 'rgba(30, 41, 59, 0.90)',
    sectorHover: 'rgba(51, 65, 85, 0.98)',
    sectorActive: 'rgba(45, 212, 191, 0.25)',
    hubBg: 'rgba(15, 23, 42, 0.96)',
  },
  emerald: {
    bgApp: 'bg-zinc-950',
    bgCanvas: 'bg-zinc-900/70',
    bgPanel: 'bg-zinc-900',
    bgHover: 'bg-zinc-800',
    border: 'border-emerald-500/25',
    textPrimary: 'text-emerald-100',
    textSecondary: 'text-emerald-400/80',
    accent: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    sectorNormal: 'rgba(6, 30, 20, 0.90)',
    sectorHover: 'rgba(13, 50, 35, 0.98)',
    sectorActive: 'rgba(16, 185, 129, 0.3)',
    hubBg: 'rgba(4, 25, 16, 0.97)',
  },
  amber: {
    bgApp: 'bg-stone-950',
    bgCanvas: 'bg-stone-900/70',
    bgPanel: 'bg-stone-900',
    bgHover: 'bg-stone-800',
    border: 'border-amber-500/25',
    textPrimary: 'text-stone-100',
    textSecondary: 'text-amber-200/70',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    sectorNormal: 'rgba(28, 25, 23, 0.90)',
    sectorHover: 'rgba(41, 37, 36, 0.98)',
    sectorActive: 'rgba(245, 158, 11, 0.28)',
    hubBg: 'rgba(20, 18, 16, 0.97)',
  },
};
