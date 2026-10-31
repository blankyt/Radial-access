import React from 'react';
import { RadialItem } from '../../types/radial';
import { createSectorPath, polarToCartesian, getAdaptiveSizing } from '../../utils/radialMath';
import { DynamicIcon } from '../common/DynamicIcon';

interface RadialSectorProps {
  item: RadialItem;
  index: number;
  totalSectors: number;
  innerRadius: number;
  outerRadius: number;
  centerX: number;
  centerY: number;
  isHovered: boolean;
  themeAccent: string;
  themeSectorNormal: string;
  themeSectorHover: string;
  themeSectorActive: string;
  showDirectionHints?: boolean;
  reducedMotion?: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export const RadialSector: React.FC<RadialSectorProps> = ({
  item,
  index,
  totalSectors,
  innerRadius,
  outerRadius,
  centerX,
  centerY,
  isHovered,
  themeAccent,
  themeSectorNormal,
  themeSectorHover,
  showDirectionHints = true,
  reducedMotion = false,
  onSelect,
  onHover,
}) => {
  const sectorSpan = 360 / totalSectors;
  // Center sector 0 at 12 o'clock (-90 deg in cartesian)
  const startAngle = index * sectorSpan - sectorSpan / 2;
  const endAngle = startAngle + sectorSpan;
  const centerAngle = index * sectorSpan;

  const { iconSize, fontSize, labelOffset } = getAdaptiveSizing(totalSectors);

  // Mid radius for label/icon placement
  const midRadius = (innerRadius + outerRadius) / 2;
  const iconPos = polarToCartesian(centerX, centerY, midRadius - 8, centerAngle);
  const textPos = polarToCartesian(centerX, centerY, midRadius + labelOffset, centerAngle);
  const badgePos = polarToCartesian(centerX, centerY, outerRadius - 10, centerAngle + sectorSpan * 0.26);
  const hintPos = polarToCartesian(centerX, centerY, innerRadius + 11, centerAngle);

  // Direction compass label (N, NE, E, SE, S, SW, W, NW)
  const directionLabels = ['N ↑', 'NE ↗', 'E →', 'SE ↘', 'S ↓', 'SW ↙', 'W ←', 'NW ↖'];
  const directionLabel = totalSectors === 8 ? directionLabels[index] : `${Math.round(centerAngle)}°`;

  const pathD = createSectorPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, totalSectors);

  // Wedge item accent color or fallback theme accent
  const itemColor = item.color || themeAccent;
  const isFolder = item.type === 'folder' || item.type === 'sub_menu';
  const isAddSlot = item.type === 'add_slot';

  // Smart label truncation based on sector angle
  const maxLabelLength = totalSectors > 12 ? 8 : totalSectors > 8 ? 11 : 14;
  const displayLabel = item.shortLabel || item.label;
  const truncatedLabel =
    displayLabel.length > maxLabelLength ? `${displayLabel.slice(0, maxLabelLength - 1)}…` : displayLabel;

  // Directional outward vector for subtle tactile lift displacement
  const rad = ((centerAngle - 90) * Math.PI) / 180;
  const liftX = Math.cos(rad) * 4.5;
  const liftY = Math.sin(rad) * 4.5;

  return (
    <g
      className="cursor-pointer transition-transform duration-200 ease-out origin-center select-none"
      style={{
        transform: isHovered
          ? `translate(${liftX}px, ${liftY}px) scale(1.026)`
          : 'translate(0px, 0px) scale(1)',
        transformOrigin: `${centerX}px ${centerY}px`,
      }}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      {/* Sector Arc Background with tactile glow */}
      <path
        d={pathD}
        fill={isAddSlot ? 'rgba(20, 25, 40, 0.45)' : isHovered ? themeSectorHover : themeSectorNormal}
        stroke={isAddSlot ? 'rgba(255, 255, 255, 0.25)' : isHovered ? itemColor : 'rgba(255, 255, 255, 0.12)'}
        strokeWidth={isHovered ? 2.5 : isAddSlot ? 1.5 : 1}
        strokeDasharray={isAddSlot ? '4 3' : undefined}
        filter={isHovered ? `drop-shadow(0 0 12px ${itemColor}99)` : undefined}
        className="transition-all duration-200"
      />

      {/* Subtle expanding ripple wave overlay when slot is hovered (omitted in reduced motion) */}
      {isHovered && !isAddSlot && !reducedMotion && (
        <path
          key={`ripple-wave-${index}`}
          d={pathD}
          fill="none"
          stroke={itemColor}
          strokeWidth={2.5}
          className="animate-sector-ripple pointer-events-none"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
      )}

      {/* Shimmer highlight stroke along outer rim on hover */}
      {isHovered && !isAddSlot && !reducedMotion && (
        <path
          d={pathD}
          fill="none"
          stroke={itemColor}
          strokeWidth={3}
          className="animate-highlight-sheen pointer-events-none"
        />
      )}

      {/* Expanding tactile ripple ring behind the icon */}
      {isHovered && !isAddSlot && !reducedMotion && (
        <circle
          key={`icon-ripple-${index}`}
          cx={iconPos.x}
          cy={iconPos.y}
          r={14}
          fill="none"
          stroke={itemColor}
          strokeWidth={2}
          className="animate-icon-ripple pointer-events-none"
          style={{ transformOrigin: `${iconPos.x}px ${iconPos.y}px` }}
        />
      )}

      {/* Faint Beginner Flick Direction Hint Vector (N, NE, E...) */}
      {showDirectionHints && !isAddSlot && (
        <g transform={`translate(${hintPos.x}, ${hintPos.y})`} className="pointer-events-none select-none opacity-45 hover:opacity-90">
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill={isHovered ? itemColor : 'rgba(148, 163, 184, 0.7)'}
            fontSize="8"
            fontFamily="monospace"
            fontWeight="600"
            className="tracking-tighter"
          >
            {item.directionHint || directionLabel}
          </text>
        </g>
      )}

      {/* Sector Icon container */}
      <g transform={`translate(${iconPos.x - iconSize / 2}, ${iconPos.y - iconSize / 2})`}>
        <foreignObject width={iconSize} height={iconSize} className="overflow-visible pointer-events-none">
          <div
            className={`flex items-center justify-center transition-all ${reducedMotion ? 'duration-0' : 'duration-200'}`}
            style={{
              width: `${iconSize}px`,
              height: `${iconSize}px`,
              color: isHovered ? '#ffffff' : itemColor,
              filter: isHovered ? `drop-shadow(0 0 8px ${itemColor})` : undefined,
              transform: isHovered && !reducedMotion ? 'scale(1.18)' : 'scale(1)',
            }}
          >
            <DynamicIcon name={item.icon || (isFolder ? 'Folder' : 'Circle')} size={iconSize} />
          </div>
        </foreignObject>
      </g>

      {/* Sector Label with luminous contrast on hover */}
      <text
        x={textPos.x}
        y={textPos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isHovered ? '#ffffff' : isAddSlot ? 'rgba(148, 163, 184, 0.8)' : 'rgba(241, 245, 249, 0.85)'}
        fontSize={fontSize}
        fontWeight={isHovered ? '600' : '500'}
        className="pointer-events-none tracking-tight font-sans transition-all duration-200"
        style={{
          filter: isHovered ? 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))' : undefined,
        }}
      >
        {truncatedLabel}
      </text>

      {/* Folder Suboptions Indicator (Little sub-wedge dots) */}
      {isFolder && (
        <g className="pointer-events-none opacity-85">
          <circle cx={iconPos.x - 3.5} cy={iconPos.y - iconSize / 2 - 3} r={1.5} fill={itemColor} />
          <circle cx={iconPos.x + 3.5} cy={iconPos.y - iconSize / 2 - 3} r={1.5} fill={itemColor} />
        </g>
      )}

      {/* Shortcut Key Badge */}
      {item.shortcutKey && totalSectors <= 12 && (
        <g transform={`translate(${badgePos.x}, ${badgePos.y})`}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill={isHovered ? itemColor : 'rgba(148, 163, 184, 0.6)'}
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="bold"
            className="pointer-events-none select-none transition-colors duration-200"
          >
            {item.shortcutKey}
          </text>
        </g>
      )}

    </g>
  );
};
