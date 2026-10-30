import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RadialItem, RadialSettings } from '../../types/radial';
import { getPointerPolar, getSectorIndexForAngle, polarToCartesian } from '../../utils/radialMath';
import { soundManager } from '../../utils/audio';
import { THEME_CONFIG } from '../../utils/themeConfig';
import { RadialSector } from './RadialSector';
import { DynamicIcon } from '../common/DynamicIcon';
import { X, ArrowLeft, ChevronRight, MousePointerClick, Folder, FileText } from 'lucide-react';

interface RadialMenuOverlayProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: RadialItem[];
  settings: RadialSettings;
  onClose: () => void;
  onSelectItem: (item: RadialItem) => void;
  onAddSlotRequest?: () => void;
}

interface MenuStackEntry {
  title: string;
  icon?: string;
  color?: string;
  items: RadialItem[];
}

interface SecondaryTooltipData {
  item: RadialItem;
  x: number;
  y: number;
  angle: number;
}

export const RadialMenuOverlay: React.FC<RadialMenuOverlayProps> = ({
  isOpen,
  position,
  items,
  settings,
  onClose,
  onSelectItem,
  onAddSlotRequest,
}) => {
  const [menuStack, setMenuStack] = useState<MenuStackEntry[]>([
    { title: settings.customRadialName || 'Radial Access', icon: 'Compass', items },
  ]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pointerCoord, setPointerCoord] = useState<{ x: number; y: number } | null>(null);
  const [secondaryTooltip, setSecondaryTooltip] = useState<SecondaryTooltipData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevHoveredIndexRef = useRef<number | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync root items when props change
  useEffect(() => {
    setMenuStack([
      {
        title: settings.customRadialName || 'Radial Access',
        icon: settings.customRadialLogoIcon || 'Compass',
        items,
      },
    ]);
  }, [items, settings.customRadialName, settings.customRadialLogoIcon]);

  const currentLevel = menuStack[menuStack.length - 1] || { title: 'Menu', items };
  const rawActiveItems = currentLevel.items;

  // Add the "+ Add Slot" wedge if setting is active and we are at root, or if requested
  const activeItems = React.useMemo(() => {
    const list = [...rawActiveItems];
    if (settings.showAddSlotButton && onAddSlotRequest && list.length < 16) {
      list.push({
        id: 'radial-item-add-slot',
        label: '+ Add Slot',
        shortLabel: '+ Add',
        icon: 'Plus',
        color: '#94a3b8',
        type: 'add_slot',
        description: 'Add a new file, folder, or tool slot to this wheel',
      });
    }
    return list;
  }, [rawActiveItems, settings.showAddSlotButton, onAddSlotRequest]);

  const isSubMenu = menuStack.length > 1;
  const theme = THEME_CONFIG[settings.theme] || THEME_CONFIG.obsidian;

  // Center radial wheel EXACTLY at cursor position
  const safeMargin = 40;
  const clampedX = Math.min(Math.max(position.x, safeMargin), window.innerWidth - safeMargin);
  const clampedY = Math.min(Math.max(position.y, safeMargin), window.innerHeight - safeMargin);

  // Dynamic outer radius calculation based on slot count
  const dynamicRadius = activeItems.length > 10 ? Math.max(settings.outerRadius, 195) : settings.outerRadius;
  const dynamicInnerRadius = activeItems.length > 10 ? Math.max(settings.innerRadius, 70) : settings.innerRadius;

  // Reset state on open / sub-menu change
  useEffect(() => {
    if (isOpen) {
      setHoveredIndex(null);
      setSecondaryTooltip(null);
      setPointerCoord({ x: clampedX, y: clampedY });
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    }
  }, [isOpen, clampedX, clampedY, menuStack.length]);

  // Audio tick on sector hover change
  useEffect(() => {
    if (hoveredIndex !== null && hoveredIndex !== prevHoveredIndexRef.current) {
      soundManager.playHoverTick(hoveredIndex);
    }
    prevHoveredIndexRef.current = hoveredIndex;
  }, [hoveredIndex]);

  // 500ms Hover Timer for Secondary Tooltip with full item description
  useEffect(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setSecondaryTooltip(null);

    if (hoveredIndex !== null && activeItems[hoveredIndex]) {
      const targetItem = activeItems[hoveredIndex];
      const targetIdx = hoveredIndex;

      // Start 500ms delay timer
      hoverTimerRef.current = setTimeout(() => {
        const sectorSpan = 360 / activeItems.length;
        const centerAngle = targetIdx * sectorSpan;

        // Position tooltip just outside outer arc of hovered slot
        const rawPoint = polarToCartesian(clampedX, clampedY, dynamicRadius + 32, centerAngle);
        // Clamp to screen bounds
        const tooltipX = Math.min(Math.max(rawPoint.x, 140), window.innerWidth - 140);
        const tooltipY = Math.min(Math.max(rawPoint.y, 60), window.innerHeight - 60);

        setSecondaryTooltip({
          item: targetItem,
          x: tooltipX,
          y: tooltipY,
          angle: centerAngle,
        });
      }, 500);
    }

    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [hoveredIndex, activeItems, clampedX, clampedY, dynamicRadius]);

  // Handle item activation — ONLY ON CLICK!
  const handleItemClick = useCallback(
    (item: RadialItem) => {
      // Clear tooltip on click
      setSecondaryTooltip(null);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }

      if (item.type === 'add_slot') {
        soundManager.playActionChime(true);
        if (onAddSlotRequest) {
          onClose();
          onAddSlotRequest();
        }
        return;
      }

      // If item is a folder or sub-menu with children, drill down to its suboptions on click!
      if ((item.type === 'folder' || item.type === 'sub_menu') && item.children && item.children.length > 0) {
        soundManager.playActionChime(true);
        setMenuStack((prev) => [
          ...prev,
          {
            title: item.label,
            icon: item.icon || 'Folder',
            color: item.color,
            items: item.children!,
          },
        ]);
        setHoveredIndex(null);
      } else if (item.type === 'folder' && (!item.children || item.children.length === 0)) {
        // Empty folder
        soundManager.playActionChime(true);
        setMenuStack((prev) => [
          ...prev,
          {
            title: item.label,
            icon: item.icon || 'Folder',
            color: item.color,
            items: [
              {
                id: `add-to-folder-${item.id}`,
                label: '+ Add to Folder',
                shortLabel: '+ Add',
                icon: 'Plus',
                color: item.color || '#38bdf8',
                type: 'add_slot',
                description: `Add custom file or tool to ${item.label}`,
              },
            ],
          },
        ]);
        setHoveredIndex(null);
      } else {
        // Leaf action (File, Tool, Command, Text Action)
        soundManager.playActionChime(true);
        onSelectItem(item);
        onClose();
      }
    },
    [onSelectItem, onClose, onAddSlotRequest]
  );

  const handleBack = useCallback(() => {
    setSecondaryTooltip(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    if (isSubMenu) {
      soundManager.playHoverTick(1);
      setMenuStack((prev) => prev.slice(0, prev.length - 1));
      setHoveredIndex(null);
    } else {
      soundManager.playCloseSound();
      onClose();
    }
  }, [isSubMenu, onClose]);

  // Track mouse coordinates for angle and distance relative to center
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const dx = e.clientX - clampedX;
      const dy = e.clientY - clampedY;
      setPointerCoord({ x: e.clientX, y: e.clientY });

      const { distance, angleDegrees } = getPointerPolar(dx, dy);

      // Compute hovered sector index purely for visual highlight (NO AUTO-OPEN ON HOVER)
      if (distance < settings.centerDeadzone) {
        setHoveredIndex(null);
      } else if (distance <= dynamicRadius + 60) {
        const sectorIdx = getSectorIndexForAngle(angleDegrees, activeItems.length);
        if (sectorIdx >= 0 && sectorIdx < activeItems.length) {
          setHoveredIndex(sectorIdx);
        } else {
          setHoveredIndex(null);
        }
      } else {
        setHoveredIndex(null);
      }
    },
    [clampedX, clampedY, settings.centerDeadzone, dynamicRadius, activeItems.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        soundManager.playCloseSound();
        onClose();
        return;
      }
      if (e.key === 'Backspace' && isSubMenu) {
        e.preventDefault();
        handleBack();
        return;
      }

      // Check number keys 1-9
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= activeItems.length) {
        e.preventDefault();
        const selected = activeItems[num - 1];
        if (selected) {
          handleItemClick(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeItems, handleItemClick, handleBack, onClose, isSubMenu]);

  if (!isOpen) return null;

  const currentHoveredItem = hoveredIndex !== null ? activeItems[hoveredIndex] : null;
  const svgSize = (dynamicRadius + 28) * 2;
  const svgCenter = svgSize / 2;

  return (
    <AnimatePresence>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          onClick={onClose}
        />

        {/* Floating Radial Wheel centered EXACTLY at cursor position */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.65, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 380 }}
          className="absolute pointer-events-auto"
          style={{
            left: `${clampedX}px`,
            top: `${clampedY}px`,
            transform: 'translate(-50%, -50%)',
            width: `${svgSize}px`,
            height: `${svgSize}px`,
          }}
        >
          {/* SVG Canvas for Wheel Slices */}
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="overflow-visible filter drop-shadow-2xl"
          >
            {/* Subtle background radar circles */}
            <circle
              cx={svgCenter}
              cy={svgCenter}
              r={dynamicRadius}
              fill="rgba(10, 15, 26, 0.45)"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
            <circle
              cx={svgCenter}
              cy={svgCenter}
              r={dynamicInnerRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Direction pointer laser line */}
            {settings.showDirectionLine && pointerCoord && (
              <line
                x1={svgCenter}
                y1={svgCenter}
                x2={svgCenter + (pointerCoord.x - clampedX) * 0.72}
                y2={svgCenter + (pointerCoord.y - clampedY) * 0.72}
                stroke={currentHoveredItem?.color || theme.accent}
                strokeWidth="2"
                strokeDasharray="2 3"
                className="opacity-75 pointer-events-none"
              />
            )}

            {/* Radial Sectors */}
            {activeItems.map((item, index) => (
              <RadialSector
                key={item.id}
                item={item}
                index={index}
                totalSectors={activeItems.length}
                innerRadius={dynamicInnerRadius}
                outerRadius={dynamicRadius}
                centerX={svgCenter}
                centerY={svgCenter}
                isHovered={hoveredIndex === index}
                themeAccent={theme.accent}
                themeSectorNormal={theme.sectorNormal}
                themeSectorHover={theme.sectorHover}
                themeSectorActive={theme.sectorActive}
                onSelect={() => handleItemClick(item)}
                onHover={() => setHoveredIndex(index)}
              />
            ))}
          </svg>

          {/* Center Hub Button */}
          <div
            className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-150 border z-10 shadow-lg text-center"
            style={{
              width: `${dynamicInnerRadius * 1.85}px`,
              height: `${dynamicInnerRadius * 1.85}px`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: theme.hubBg,
              borderColor: currentHoveredItem?.color || (isSubMenu ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)'),
              boxShadow: currentHoveredItem
                ? `0 0 16px ${currentHoveredItem.color}55`
                : isSubMenu
                ? '0 0 16px rgba(56, 189, 248, 0.3)'
                : '0 4px 20px rgba(0,0,0,0.5)',
            }}
            onClick={handleBack}
            title={isSubMenu ? 'Click to go back to parent menu' : 'Click to close'}
          >
            {currentHoveredItem ? (
              <div className="flex flex-col items-center justify-center text-center px-1.5 select-none animate-in fade-in zoom-in duration-100">
                <DynamicIcon
                  name={currentHoveredItem.icon || (currentHoveredItem.type === 'folder' ? 'Folder' : 'Circle')}
                  className="w-4 h-4 mb-0.5"
                  color={currentHoveredItem.color || theme.accent}
                />
                <span className="text-[10px] font-semibold text-white tracking-tight line-clamp-1 max-w-[80px]">
                  {currentHoveredItem.label}
                </span>
                <span className="text-[8px] text-slate-400 font-mono mt-0.5 flex items-center gap-0.5">
                  <MousePointerClick className="w-2.5 h-2.5 inline" /> Click to open
                </span>
              </div>
            ) : isSubMenu ? (
              <div className="flex flex-col items-center justify-center text-sky-300 hover:text-white px-1">
                <ArrowLeft className="w-4 h-4 mb-0.5 text-sky-400" />
                <span className="text-[10px] font-semibold tracking-tight line-clamp-1 max-w-[78px]">
                  {currentLevel.title}
                </span>
                <span className="text-[8px] text-slate-400 font-mono">
                  {activeItems.length} options · [Back]
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 hover:text-white px-1">
                {settings.customRadialLogoUrl ? (
                  <img
                    src={settings.customRadialLogoUrl}
                    alt="radial logo"
                    className="w-5 h-5 rounded-full object-cover mb-0.5 border border-white/20 shadow-sm"
                  />
                ) : (
                  <DynamicIcon
                    name={settings.customRadialLogoIcon || 'Compass'}
                    className="w-5 h-5 text-sky-400 mb-0.5 animate-spin-slow"
                  />
                )}
                <span className="text-[10px] font-bold tracking-tight text-white line-clamp-1 max-w-[80px]">
                  {settings.customRadialName || 'Radial Access'}
                </span>
                <span className="text-[8px] text-slate-400 font-mono mt-0.5">
                  {activeItems.length} slots · [ESC]
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Secondary Description Tooltip (Appears when hovering a slot for > 500ms) */}
        <AnimatePresence>
          {secondaryTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 4 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${secondaryTooltip.x}px`,
                top: `${secondaryTooltip.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md rounded-xl p-3.5 max-w-[260px] text-left text-slate-100 flex flex-col gap-2">
                {/* Header: Icon + Full Name */}
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: secondaryTooltip.item.color || theme.accent }}
                  >
                    <DynamicIcon
                      name={
                        secondaryTooltip.item.icon ||
                        (secondaryTooltip.item.type === 'folder' ? 'Folder' : 'FileText')
                      }
                      size={15}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-white break-words leading-tight">
                      {secondaryTooltip.item.label}
                    </h4>
                    <span className="text-[10px] text-sky-400 font-mono mt-0.5 block">
                      {secondaryTooltip.item.type === 'folder'
                        ? `📁 Folder · ${secondaryTooltip.item.children?.length || 0} suboptions`
                        : secondaryTooltip.item.type === 'file'
                        ? '📄 Custom Document'
                        : secondaryTooltip.item.type === 'tool'
                        ? '🛠️ Instant Tool'
                        : secondaryTooltip.item.type === 'add_slot'
                        ? '+ Add Wedge'
                        : '⚡ System Command'}
                    </span>
                  </div>
                </div>

                {/* Full Description & File Identifier Details */}
                {secondaryTooltip.item.description && (
                  <p className="text-[11px] text-slate-300 leading-snug border-t border-slate-800/80 pt-2">
                    {secondaryTooltip.item.description}
                  </p>
                )}

                {/* Shortcut & Click Cue */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-sky-300">
                    <MousePointerClick className="w-3 h-3 text-sky-400" />
                    <span>Click to open</span>
                  </span>
                  {secondaryTooltip.item.shortcutKey && (
                    <span className="bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700 text-slate-300">
                      Key [{secondaryTooltip.item.shortcutKey}]
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Floating Info Pill with Breadcrumbs */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs text-slate-200"
          >
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 font-medium">
              {menuStack.map((level, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                  <span
                    className={
                      idx === menuStack.length - 1 ? 'text-sky-400 font-semibold' : 'text-slate-400'
                    }
                  >
                    {level.title}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="w-px h-3.5 bg-slate-700" />

            <div className="text-slate-300 flex items-center gap-2">
              <MousePointerClick className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {currentHoveredItem ? (
                <span>
                  <strong className="text-white">{currentHoveredItem.label}</strong>
                  {currentHoveredItem.type === 'folder'
                    ? ' — Click to open folder suboptions'
                    : currentHoveredItem.description
                    ? ` — ${currentHoveredItem.description}`
                    : ' — Click to select'}
                </span>
              ) : isSubMenu ? (
                <span className="text-sky-300">
                  Click a file to open, or click center hub to go back
                </span>
              ) : (
                <span className="text-slate-400">
                  Hover for 500ms to preview details · <strong>Click any slot to select/open</strong>
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="pointer-events-auto ml-2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
              title="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
