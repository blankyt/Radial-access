import { RadialItem, RadialSettings, UserFile, UserFolder } from '../types/radial';

export const INITIAL_USER_FOLDERS: UserFolder[] = [
  {
    id: 'folder-docs',
    name: 'Project Docs',
    color: '#38bdf8',
    icon: 'Folder',
    description: 'Documentation, specs, and configurations',
    isPinnedToRadial: true,
  },
  {
    id: 'folder-code',
    name: 'Scripts & Data',
    color: '#a855f7',
    icon: 'FolderGit2',
    description: 'Code snippets, algorithms, and CSV datasets',
    isPinnedToRadial: true,
  },
  {
    id: 'folder-tools',
    name: 'Toolbox',
    color: '#fbbf24',
    icon: 'FolderCog',
    description: 'Calculator, Color Lab, Notes, and Timer',
    isPinnedToRadial: true,
  },
];

export const INITIAL_USER_FILES: UserFile[] = [
  {
    id: 'file-notes',
    name: 'project_brief.md',
    size: 1420,
    type: 'text/markdown',
    lastModified: Date.now() - 3600000 * 4,
    color: '#38bdf8',
    folderId: 'folder-docs',
    isPinnedToRadial: true,
    tags: ['docs', 'planning'],
    content: `# Radial Access System Architecture

Welcome to **Radial Access**! This radial shortcut wheel allows rapid tool launching, instant formatting, and single-click access to your custom files.

## Folders & Suboptions
- Click any **Folder** wedge in the radial menu to instantly expand into its suboptions!
- Add your own custom folders and organize files neatly.
- Cursor spawn: Right-click anywhere and the radial wheel appears directly at your cursor.

### Quick Actions
- [x] Test radial menu activation (Right-click at cursor)
- [x] Open a folder suboptions wheel
- [x] Practice directional flicks in Drill mode
`,
  },
  {
    id: 'file-config',
    name: 'app_settings.json',
    size: 890,
    type: 'application/json',
    lastModified: Date.now() - 3600000 * 12,
    color: '#fbbf24',
    folderId: 'folder-docs',
    isPinnedToRadial: true,
    tags: ['config', 'dev'],
    content: JSON.stringify(
      {
        appName: 'Radial Access Workspace',
        version: '2.6.0',
        preferences: {
          radialRadius: 180,
          audioFeedback: true,
          cursorCentering: true,
          slotsCapacity: 12,
          defaultTheme: 'obsidian',
        },
        activePlugins: ['calculator', 'code_runner', 'file_vault', 'color_lab'],
      },
      null,
      2
    ),
  },
  {
    id: 'file-code',
    name: 'vector_math.ts',
    size: 2150,
    type: 'text/typescript',
    lastModified: Date.now() - 3600000 * 24,
    color: '#a855f7',
    folderId: 'folder-code',
    isPinnedToRadial: true,
    tags: ['code', 'math'],
    content: `// 2D Vector & Polar Geometry Library for Radial Controls
export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  magnitude(): number {
    return Math.hypot(this.x, this.y);
  }

  angleDeg(): number {
    let angle = Math.atan2(this.y, this.x) * (180 / Math.PI);
    return (angle + 90 + 360) % 360; // 0° is North
  }
}
`,
  },
  {
    id: 'file-csv',
    name: 'quarterly_metrics.csv',
    size: 1640,
    type: 'text/csv',
    lastModified: Date.now() - 3600000 * 48,
    color: '#10b981',
    folderId: 'folder-code',
    isPinnedToRadial: true,
    tags: ['data', 'analytics'],
    content: `Quarter,Revenue,ActiveUsers,RetentionRate,AvgLatencyMs
Q1 2026,145200,12400,89.4%,42
Q2 2026,189400,18920,91.2%,38
Q3 2026,242000,26500,93.5%,31
Q4 2026,310500,34100,94.8%,28
`,
  },
];

export const DEFAULT_SETTINGS: RadialSettings = {
  theme: 'obsidian',
  outerRadius: 180,
  innerRadius: 65,
  centerDeadzone: 44,
  soundEnabled: true,
  activationTrigger: 'right_click',
  holdToSelect: false,
  showDirectionLine: true,
  hapticBlip: true,
  sectorCount: 8,
  autoFitSectors: true,
  showAddSlotButton: true,
  customHotkeysEnabled: true,
  flickGestureEnabled: true,
  flickSensitivity: 'normal',
  customRadialName: 'Radial Access',
  customRadialLogoIcon: 'Compass',
  customRadialTagline: 'Quick Tool & Custom File Interface',
};

export const DEFAULT_ROOT_MENU: RadialItem[] = [
  {
    id: 'folder-slot-docs',
    label: 'Project Docs',
    shortLabel: '📁 Docs',
    icon: 'Folder',
    color: '#38bdf8',
    type: 'folder',
    folderId: 'folder-docs',
    shortcutKey: '1',
    description: 'Folder with markdown briefs & app configs (Click to open suboptions)',
    children: [
      {
        id: 'file-sub-brief',
        label: 'project_brief.md',
        icon: 'FileText',
        color: '#38bdf8',
        type: 'file',
        fileId: 'file-notes',
        shortcutKey: '1',
        description: 'Markdown spec & feature checklist',
      },
      {
        id: 'file-sub-config',
        label: 'app_settings.json',
        icon: 'Code',
        color: '#fbbf24',
        type: 'file',
        fileId: 'file-config',
        shortcutKey: '2',
        description: 'Configuration & JSON preferences',
      },
    ],
  },
  {
    id: 'folder-slot-code',
    label: 'Scripts & Data',
    shortLabel: '📁 Code/Data',
    icon: 'FolderGit2',
    color: '#a855f7',
    type: 'folder',
    folderId: 'folder-code',
    shortcutKey: '2',
    description: 'Folder with TypeScript algorithms & CSV metrics (Click to open suboptions)',
    children: [
      {
        id: 'file-sub-vector',
        label: 'vector_math.ts',
        icon: 'Terminal',
        color: '#a855f7',
        type: 'file',
        fileId: 'file-code',
        shortcutKey: '1',
        description: 'TypeScript math library',
      },
      {
        id: 'file-sub-csv',
        label: 'quarterly_metrics.csv',
        icon: 'Table',
        color: '#10b981',
        type: 'file',
        fileId: 'file-csv',
        shortcutKey: '2',
        description: 'Tabular CSV performance data',
      },
    ],
  },
  {
    id: 'folder-slot-tools',
    label: 'Quick Tools',
    shortLabel: '📁 Toolbox',
    icon: 'Wrench',
    color: '#fbbf24',
    type: 'folder',
    folderId: 'folder-tools',
    shortcutKey: '3',
    description: 'Folder with Calculator, Color Lab, Notes & Timer (Click to open suboptions)',
    children: [
      {
        id: 'tool-sub-calc',
        label: 'Calculator',
        icon: 'Calculator',
        color: '#3b82f6',
        type: 'tool',
        toolId: 'calculator',
        shortcutKey: '1',
        description: 'Instant math solver & expression parser',
      },
      {
        id: 'tool-sub-notes',
        label: 'Quick Scratchpad',
        icon: 'PenTool',
        color: '#10b981',
        type: 'tool',
        toolId: 'notes',
        shortcutKey: '2',
        description: 'Floating memo & scratchpad editor',
      },
      {
        id: 'tool-sub-palette',
        label: 'Color Lab',
        icon: 'Palette',
        color: '#f43f5e',
        type: 'tool',
        toolId: 'palette',
        shortcutKey: '3',
        description: 'Color converter & palette generator',
      },
      {
        id: 'tool-sub-timer',
        label: 'Focus Timer',
        icon: 'Clock',
        color: '#eab308',
        type: 'tool',
        toolId: 'timer',
        shortcutKey: '4',
        description: 'Pomodoro timer & stopwatch',
      },
    ],
  },
  {
    id: 'item-calc-direct',
    label: 'Calculator',
    shortLabel: 'Calc',
    icon: 'Calculator',
    color: '#60a5fa',
    type: 'tool',
    toolId: 'calculator',
    shortcutKey: '4',
    description: 'Instant inline calculation',
  },
  {
    id: 'folder-slot-format',
    label: 'Text & Transform',
    shortLabel: '📁 Format',
    icon: 'Sparkles',
    color: '#c084fc',
    type: 'folder',
    shortcutKey: '5',
    description: 'Folder with string formatting tools (Click to open suboptions)',
    children: [
      {
        id: 'format-upper',
        label: 'UPPERCASE',
        icon: 'Type',
        color: '#60a5fa',
        type: 'text_action',
        textAction: 'uppercase',
        shortcutKey: '1',
        description: 'Convert text to all uppercase',
      },
      {
        id: 'format-lower',
        label: 'lowercase',
        icon: 'Type',
        color: '#34d399',
        type: 'text_action',
        textAction: 'lowercase',
        shortcutKey: '2',
        description: 'Convert text to all lowercase',
      },
      {
        id: 'format-title',
        label: 'Title Case',
        icon: 'Heading',
        color: '#f59e0b',
        type: 'text_action',
        textAction: 'capitalize',
        shortcutKey: '3',
        description: 'Capitalize each principal word',
      },
      {
        id: 'format-slug',
        label: 'kebab-slug',
        icon: 'Link',
        color: '#ec4899',
        type: 'text_action',
        textAction: 'slugify',
        shortcutKey: '4',
        description: 'Convert text into a URL slug',
      },
      {
        id: 'format-json',
        label: 'Prettify JSON',
        icon: 'Braces',
        color: '#8b5cf6',
        type: 'text_action',
        textAction: 'json_format',
        shortcutKey: '5',
        description: 'Format & indent JSON string',
      },
    ],
  },
  {
    id: 'item-drill',
    label: 'Speed Drill',
    shortLabel: 'Drill',
    icon: 'Target',
    color: '#f97316',
    type: 'system',
    systemAction: 'drill_mode',
    shortcutKey: '6',
    description: 'Train fast directional flick reflexes',
  },
  {
    id: 'item-files-hub',
    label: 'Files Hub',
    shortLabel: 'Vault',
    icon: 'UploadCloud',
    color: '#06b6d4',
    type: 'system',
    systemAction: 'files_hub',
    shortcutKey: '7',
    description: 'Manage files, folders & uploads',
  },
  {
    id: 'item-customize',
    label: 'Radial Config',
    shortLabel: 'Config',
    icon: 'Settings',
    color: '#94a3b8',
    type: 'system',
    systemAction: 'customize',
    shortcutKey: '8',
    description: 'Customize slots count, themes & gestures',
  },
];
