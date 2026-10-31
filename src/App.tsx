/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RadialItem, RadialSettings, UserFile, UserFolder } from './types/radial';
import { storage } from './utils/storage';
import { soundManager } from './utils/audio';
import { THEME_CONFIG } from './utils/themeConfig';

// Components
import { TopBar } from './components/navigation/TopBar';
import { WorkspaceCanvas } from './components/workspace/WorkspaceCanvas';
import { RadialMenuOverlay } from './components/radial/RadialMenuOverlay';
import { FileManagerModal } from './components/files/FileManagerModal';
import { FileViewerModal } from './components/files/FileViewerModal';
import {
  CalculatorModal,
  NotesModal,
  ColorPaletteModal,
  FocusTimerModal,
  TextTransformerModal,
} from './components/tools/ToolModals';
import { MuscleMemoryDrillModal } from './components/practice/MuscleMemoryDrillModal';
import { RadialCustomizerModal } from './components/customizer/RadialCustomizerModal';
import { WindowsNativeModal } from './components/native/WindowsNativeModal';
import { SpeedBenchmarkModal } from './components/tools/SpeedBenchmarkModal';
import { WheelPacksModal } from './components/customizer/WheelPacksModal';
import { WHEEL_PACKS } from './data/wheelPacks';
import { ContextProfile, WheelPack } from './types/radial';
import { Compass } from 'lucide-react';

const INITIAL_BUFFER_TEXT = `// Radial Access Interactive Workspace
// Right-click or Middle-click ANYWHERE on your screen to spawn the Radial Shortcut Wheel directly at your cursor!
// Try FLICKING: Drag your mouse quickly in any direction to trigger that item without clicking!

const systemConfig = {
  radialInterface: "Radial Access v2.8",
  features: [
    "Marking Menu Mode: Press & hold -> flick -> release to execute without second click",
    "Cursor-centric spawn: Wheel centers exactly on mouse tip (Distance = 0)",
    "Fitts's Law Target Geometry: Infinite angular wedge depth",
    "Context-Aware Wheels: Specialized profiles for Developer, Designer, Video & Daily",
    "Reduced Motion & High Contrast accessibility modes",
    "Zero Telemetry, 100% offline, zero keystroke logging"
  ]
};

Highlight any words here and right-click to apply transforms or inspect your files!
`;

export default function App() {
  // App Persistent State
  const [files, setFiles] = useState<UserFile[]>(() => storage.loadFiles());
  const [folders, setFolders] = useState<UserFolder[]>(() => storage.loadFolders());
  const [menuItems, setMenuItems] = useState<RadialItem[]>(() => storage.loadMenuItems());
  const [settings, setSettings] = useState<RadialSettings>(() => storage.loadSettings());
  const [scratchpadText, setScratchpadText] = useState<string>(() => storage.loadNotes());
  const [bufferText, setBufferText] = useState<string>(INITIAL_BUFFER_TEXT);

  // Radial Menu State
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [radialPos, setRadialPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const mouseCoordRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Modals & Panels State
  const [activeFileViewer, setActiveFileViewer] = useState<UserFile | null>(null);
  const [isFilesHubOpen, setIsFilesHubOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isTransformerOpen, setIsTransformerOpen] = useState(false);
  const [isWindowsNativeOpen, setIsWindowsNativeOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isPacksOpen, setIsPacksOpen] = useState(false);


  // Notifications
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Sync state to storage
  useEffect(() => {
    storage.saveFiles(files);
  }, [files]);

  useEffect(() => {
    storage.saveFolders(folders);
  }, [folders]);

  useEffect(() => {
    storage.saveMenuItems(menuItems);
  }, [menuItems]);

  useEffect(() => {
    storage.saveSettings(settings);
    soundManager.enabled = settings.soundEnabled;
  }, [settings]);

  // Open Radial at exact coordinates
  const openRadialAt = useCallback((x: number, y: number) => {
    soundManager.playOpenSound();
    setRadialPos({ x, y });
    setIsRadialOpen(true);
  }, []);

  // Track cursor position globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseCoordRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Global ContextMenu (Right-Click) to appear directly at cursor anywhere on page!
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      openRadialAt(e.clientX, e.clientY);
    };

    window.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => window.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, [openRadialAt]);

  // Global Hotkey (Spacebar) to appear directly at cursor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Global shortcut for User Settings (Ctrl+, or Alt+Shift+S)
      if ((e.key === ',' && (e.ctrlKey || e.metaKey)) || (e.altKey && e.shiftKey && e.code === 'KeyS')) {
        e.preventDefault();
        setIsCustomizerOpen(true);
        return;
      }

      // Spacebar summon if not actively typing
      if (e.code === 'Space' && !isInput && !isRadialOpen) {
        e.preventDefault();
        openRadialAt(mouseCoordRef.current.x, mouseCoordRef.current.y);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRadialOpen, openRadialAt]);

  // Construct dynamic menu items with folder suboptions synced with current vault files
  const computedMenuItems = React.useMemo(() => {
    return menuItems.map((item) => {
      // If this item is a folder, populate its children dynamically from files in that folder!
      if (item.type === 'folder' && item.folderId) {
        const folderFiles = files.filter((f) => f.folderId === item.folderId);
        const folderDef = folders.find((f) => f.id === item.folderId);

        const subChildren: RadialItem[] = folderFiles.map((f, idx) => ({
          id: `folder-file-${f.id}`,
          label: f.name,
          icon: 'FileText',
          color: f.color || folderDef?.color || '#38bdf8',
          type: 'file',
          fileId: f.id,
          shortcutKey: String(idx + 1),
          description: `${(f.size / 1024).toFixed(1)} KB · File inside ${folderDef?.name || 'Folder'}`,
        }));

        // Preserve any custom tool/command children already inside this folder
        if (item.children) {
          item.children.forEach((c) => {
            if (c.type !== 'file' && !subChildren.some((sc) => sc.id === c.id)) {
              subChildren.push(c);
            }
          });
        }

        // Add an "+ Add to Folder" shortcut as the last suboption
        subChildren.push({
          id: `add-file-to-${item.folderId}`,
          label: '+ Add to Folder',
          shortLabel: '+ Add File',
          icon: 'UploadCloud',
          color: '#f43f5e',
          type: 'system',
          systemAction: 'files_hub',
          shortcutKey: String((subChildren.length % 9) + 1),
          description: `Import files into ${folderDef?.name || 'this folder'}`,
        });

        return {
          ...item,
          label: folderDef?.name || item.label,
          color: folderDef?.color || item.color,
          children: subChildren,
        };
      }
      return item;
    });
  }, [menuItems, files, folders]);

  // Execute radial action
  const handleSelectRadialItem = (item: RadialItem) => {
    switch (item.type) {
      case 'file': {
        if (item.fileId) {
          const target = files.find((f) => f.id === item.fileId);
          if (target) {
            setActiveFileViewer(target);
            showStatus(`Opened "${target.name}"`);
          } else {
            showStatus('File not found');
          }
        }
        break;
      }
      case 'tool': {
        if (item.toolId === 'calculator') setIsCalcOpen(true);
        else if (item.toolId === 'notes') setIsNotesOpen(true);
        else if (item.toolId === 'palette') setIsPaletteOpen(true);
        else if (item.toolId === 'timer') setIsTimerOpen(true);
        else if (item.toolId === 'formatter') setIsTransformerOpen(true);
        showStatus(`Launched ${item.label}`);
        break;
      }
      case 'text_action': {
        handleTextAction(item.textAction);
        break;
      }
      case 'system': {
        if (item.systemAction === 'files_hub') setIsFilesHubOpen(true);
        else if (item.systemAction === 'drill_mode') setIsDrillOpen(true);
        else if (item.systemAction === 'customize') setIsCustomizerOpen(true);
        else if (item.systemAction === 'benchmark') setIsBenchmarkOpen(true);
        else if (item.systemAction === 'packs') setIsPacksOpen(true);
        else if (item.systemAction === 'open_native_modal') setIsWindowsNativeOpen(true);
        else if (item.systemAction === 'clear_canvas') {
          setBufferText('');
          showStatus('Canvas cleared');
        }
        break;
      }
      case 'custom_command': {
        if (item.customPayload?.startsWith('http')) {
          window.open(item.customPayload, '_blank', 'noopener,noreferrer');
        }
        showStatus(`Executed "${item.label}"`);
        break;
      }
      case 'add_slot': {
        setIsCustomizerOpen(true);
        break;
      }
    }
  };

  // Switch Active Context Profile (Global, VS Code, Figma, Premiere)
  const handleSwitchContext = useCallback((context: ContextProfile) => {
    setSettings((prev) => ({ ...prev, activeContext: context }));
    const pack = WHEEL_PACKS.find((p) => p.context === context);
    if (pack) {
      setMenuItems(pack.items);
      showStatus(`Context profile activated: ${pack.name}`);
    }
  }, []);


  // Text Transform Handler
  const handleTextAction = (action?: string) => {
    if (!action) return;
    let next = bufferText;
    switch (action) {
      case 'uppercase':
        next = bufferText.toUpperCase();
        showStatus('Converted text to UPPERCASE');
        break;
      case 'lowercase':
        next = bufferText.toLowerCase();
        showStatus('Converted text to lowercase');
        break;
      case 'capitalize':
        next = bufferText.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
        showStatus('Applied Title Case');
        break;
      case 'slugify':
        next = bufferText
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        showStatus('Converted to kebab-slug');
        break;
      case 'json_format':
        try {
          next = JSON.stringify(JSON.parse(bufferText), null, 2);
          showStatus('Prettified JSON successfully');
        } catch {
          showStatus('Invalid JSON in buffer');
        }
        break;
      default:
        setIsTransformerOpen(true);
    }
    setBufferText(next);
  };

  // File & Folder Operations
  const handleAddFiles = (newFiles: UserFile[]) => {
    setFiles((prev) => [...newFiles, ...prev]);
    showStatus(`Added ${newFiles.length} file${newFiles.length === 1 ? '' : 's'} to Vault`);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (activeFileViewer?.id === fileId) {
      setActiveFileViewer(null);
    }
    showStatus('File removed');
  };

  const handleSaveFileContent = (updated: UserFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setActiveFileViewer(updated);
    showStatus(`Saved "${updated.name}"`);
  };

  const handleTogglePinFile = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const nextState = !f.isPinnedToRadial;
          showStatus(nextState ? `Pinned "${f.name}" to Radial Menu` : `Unpinned "${f.name}"`);
          return { ...f, isPinnedToRadial: nextState };
        }
        return f;
      })
    );
  };

  const handleUpdateFileColor = (fileId: string, color: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, color } : f)));
  };

  const handleAddFolder = (newFolder: UserFolder) => {
    setFolders((prev) => [...prev, newFolder]);
    // Also create a radial slot for this folder if pinned
    if (newFolder.isPinnedToRadial) {
      const folderSlot: RadialItem = {
        id: `slot-folder-${newFolder.id}`,
        label: newFolder.name,
        shortLabel: `📁 ${newFolder.name.slice(0, 8)}`,
        icon: 'Folder',
        color: newFolder.color || '#38bdf8',
        type: 'folder',
        folderId: newFolder.id,
        shortcutKey: String((menuItems.length % 9) + 1),
        description: `Folder with suboptions (Click or flick to select inside)`,
        children: [],
      };
      setMenuItems((prev) => [...prev, folderSlot]);
    }
    showStatus(`Created folder "${newFolder.name}" with radial suboptions!`);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setMenuItems((prev) => prev.filter((m) => m.folderId !== folderId));
    // Unassign files from this folder
    setFiles((prev) =>
      prev.map((f) => (f.folderId === folderId ? { ...f, folderId: undefined } : f))
    );
    showStatus('Folder removed');
  };

  const handleTogglePinFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          const nextState = !f.isPinnedToRadial;
          if (nextState) {
            // Add slot
            const exists = menuItems.some((m) => m.folderId === folderId);
            if (!exists) {
              setMenuItems((m) => [
                ...m,
                {
                  id: `slot-folder-${f.id}`,
                  label: f.name,
                  shortLabel: `📁 ${f.name.slice(0, 8)}`,
                  icon: 'Folder',
                  color: f.color || '#38bdf8',
                  type: 'folder',
                  folderId: f.id,
                  shortcutKey: String((m.length % 9) + 1),
                  description: 'Folder with suboptions',
                },
              ]);
            }
          } else {
            // Remove slot
            setMenuItems((m) => m.filter((slot) => slot.folderId !== folderId));
          }
          showStatus(nextState ? `Pinned folder "${f.name}" to Radial Wheel` : `Unpinned folder "${f.name}"`);
          return { ...f, isPinnedToRadial: nextState };
        }
        return f;
      })
    );
  };

  const handleMoveFileToFolder = (fileId: string, folderId?: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, folderId } : f)));
    const targetFolder = folders.find((fld) => fld.id === folderId);
    showStatus(targetFolder ? `Moved to "${targetFolder.name}"` : 'Removed from folder');
  };

  const handleDropFiles = (droppedFileList: FileList) => {
    const loadedFiles: UserFile[] = [];
    const promises: Promise<void>[] = [];

    Array.from(droppedFileList).forEach((file, index) => {
      const p = new Promise<void>((resolve) => {
        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');
        reader.onload = (e) => {
          const content = (e.target?.result as string) || '';
          loadedFiles.push({
            id: `dropped-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            lastModified: file.lastModified,
            content,
            isPinnedToRadial: true,
            color: '#38bdf8',
            tags: [file.name.split('.').pop() || 'file'],
          });
          resolve();
        };

        if (isImage) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });
      promises.push(p);
    });

    Promise.all(promises).then(() => {
      handleAddFiles(loadedFiles);
    });
  };

  const theme = THEME_CONFIG[settings.theme] || THEME_CONFIG.obsidian;

  return (
    <div className={`min-h-screen flex flex-col font-sans ${theme.bgApp} text-slate-100 overflow-x-hidden relative`}>
      {/* Top Bar */}
      <TopBar
        filesCount={files.length}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenFilesHub={() => setIsFilesHubOpen(true)}
        onOpenDrill={() => setIsDrillOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenWindowsNative={() => setIsWindowsNativeOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onOpenPacks={() => setIsPacksOpen(true)}
        onSwitchContext={handleSwitchContext}
        onTriggerRadialCenter={() => openRadialAt(mouseCoordRef.current.x, mouseCoordRef.current.y)}
      />

      {/* Main Interactive Workspace Canvas & Background Interface */}
      <WorkspaceCanvas
        files={files}
        folders={folders}
        menuItems={menuItems}
        settings={settings}
        onUpdateSettings={setSettings}
        onUpdateMenuItems={setMenuItems}
        onAddFolder={handleAddFolder}
        onOpenRadialAt={openRadialAt}
        onOpenFile={(f) => setActiveFileViewer(f)}
        onOpenFilesHub={() => setIsFilesHubOpen(true)}
        onOpenDrill={() => setIsDrillOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onOpenPacks={() => setIsPacksOpen(true)}
        onOpenWindowsNative={() => setIsWindowsNativeOpen(true)}
        onDropFiles={handleDropFiles}
        lastActionMessage={statusNotification}
        bufferText={bufferText}
        setBufferText={setBufferText}
      />


      {/* Radial Menu Overlay (Centered directly at cursor) */}
      <RadialMenuOverlay
        isOpen={isRadialOpen}
        position={radialPos}
        items={computedMenuItems}
        settings={settings}
        onClose={() => setIsRadialOpen(false)}
        onSelectItem={handleSelectRadialItem}
        onAddSlotRequest={() => setIsCustomizerOpen(true)}
        onOpenSettings={() => setIsCustomizerOpen(true)}
      />

      {/* Dedicated Modals & Tool Windows */}
      <FileManagerModal
        isOpen={isFilesHubOpen}
        files={files}
        folders={folders}
        onClose={() => setIsFilesHubOpen(false)}
        onAddFiles={handleAddFiles}
        onDeleteFile={handleDeleteFile}
        onOpenFile={(f) => {
          setIsFilesHubOpen(false);
          setActiveFileViewer(f);
        }}
        onTogglePinFile={handleTogglePinFile}
        onUpdateFileColor={handleUpdateFileColor}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
        onTogglePinFolder={handleTogglePinFolder}
        onMoveFileToFolder={handleMoveFileToFolder}
      />

      <FileViewerModal
        file={activeFileViewer}
        isOpen={activeFileViewer !== null}
        onClose={() => setActiveFileViewer(null)}
        onSaveFile={handleSaveFileContent}
        onTogglePin={handleTogglePinFile}
      />

      <CalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />

      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notesText={scratchpadText}
        onSaveNotes={(text) => {
          setScratchpadText(text);
          storage.saveNotes(text);
          showStatus('Scratchpad saved');
        }}
      />

      <ColorPaletteModal isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      <FocusTimerModal isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />

      <TextTransformerModal
        isOpen={isTransformerOpen}
        onClose={() => setIsTransformerOpen(false)}
        initialText={bufferText}
        onApplyText={(transformed) => {
          setBufferText(transformed);
          showStatus('Transformed text applied');
        }}
      />

      <MuscleMemoryDrillModal
        isOpen={isDrillOpen}
        items={computedMenuItems}
        onClose={() => setIsDrillOpen(false)}
        onOpenRadialForPractice={() => openRadialAt(mouseCoordRef.current.x, mouseCoordRef.current.y)}
      />

      <RadialCustomizerModal
        isOpen={isCustomizerOpen}
        settings={settings}
        menuItems={menuItems}
        folders={folders}
        onClose={() => setIsCustomizerOpen(false)}
        onUpdateSettings={setSettings}
        onUpdateMenuItems={setMenuItems}
        onAddFolder={handleAddFolder}
        onOpenWindowsNative={() => setIsWindowsNativeOpen(true)}
      />

      <WindowsNativeModal
        isOpen={isWindowsNativeOpen}
        onClose={() => setIsWindowsNativeOpen(false)}
        settings={settings}
        menuItems={computedMenuItems}
        folders={folders}
      />

      <SpeedBenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        onOpenDrill={() => {
          setIsBenchmarkOpen(false);
          setIsDrillOpen(true);
        }}
      />

      <WheelPacksModal
        isOpen={isPacksOpen}
        currentSettings={settings}
        currentMenuItems={menuItems}
        onClose={() => setIsPacksOpen(false)}
        onApplyPack={(pack: WheelPack) => {
          setMenuItems(pack.items);
          setSettings((prev) => ({ ...prev, activeContext: pack.context }));
          showStatus(`Applied ${pack.name}!`);
        }}
        onUpdateSettings={setSettings}
        onImportMenuItems={(imported) => {
          setMenuItems(imported);
          showStatus('Imported wheel pack successfully!');
        }}
      />


      {/* Floating Glowing Trigger Orb */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            openRadialAt(rect.left - 130, rect.top - 130);
          }}
          className="group relative w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/25 hover:shadow-sky-500/50 hover:scale-105 active:scale-95 transition-all"
          title="Click to summon Radial Menu at cursor (or Right-Click / Space anywhere)"
        >
          <div className="absolute inset-0 rounded-full bg-sky-400 opacity-20 blur-md group-hover:opacity-40 transition-opacity" />
          <Compass className="w-6 h-6 animate-spin-slow relative z-10" />
          <span className="sr-only">Summon Radial Menu</span>
        </button>
      </div>
    </div>
  );
}
