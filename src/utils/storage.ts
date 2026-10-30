import { RadialItem, RadialSettings, UserFile, UserFolder } from '../types/radial';
import {
  DEFAULT_ROOT_MENU,
  DEFAULT_SETTINGS,
  INITIAL_USER_FILES,
  INITIAL_USER_FOLDERS,
} from '../data/defaultRadialData';

const STORAGE_KEYS = {
  FILES: 'orbitradial_user_files_v2',
  FOLDERS: 'orbitradial_user_folders_v2',
  MENU: 'orbitradial_menu_items_v2',
  SETTINGS: 'orbitradial_settings_v2',
  NOTES: 'orbitradial_scratchpad_notes_v2',
};

export const storage = {
  loadFiles(): UserFile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FILES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(INITIAL_USER_FILES));
        return INITIAL_USER_FILES;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_USER_FILES;
    }
  },

  saveFiles(files: UserFile[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    } catch (e) {
      console.warn('Could not save files to localStorage:', e);
    }
  },

  loadFolders(): UserFolder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(INITIAL_USER_FOLDERS));
        return INITIAL_USER_FOLDERS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_USER_FOLDERS;
    }
  },

  saveFolders(folders: UserFolder[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.warn('Could not save folders to localStorage:', e);
    }
  },

  loadMenuItems(): RadialItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MENU);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_ROOT_MENU));
        return DEFAULT_ROOT_MENU;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_ROOT_MENU;
    }
  },

  saveMenuItems(items: RadialItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save menu items to localStorage:', e);
    }
  },

  loadSettings(): RadialSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      if (
        parsed.customRadialName === 'OrbitRadial' ||
        parsed.customRadialName === 'nearly' ||
        !parsed.customRadialName
      ) {
        parsed.customRadialName = 'Radial Access';
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: RadialSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
  },

  loadNotes(): string {
    return (
      localStorage.getItem(STORAGE_KEYS.NOTES) ||
      '# Scratchpad\n\n- Quick note captured via Radial shortcut\n- Press Space or Right-Click anywhere'
    );
  },

  saveNotes(text: string) {
    localStorage.setItem(STORAGE_KEYS.NOTES, text);
  },
};
