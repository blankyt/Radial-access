/**
 * Geometry & Math helpers for Radial Wheel / Pie Slices
 */

export interface Point {
  x: number;
  y: number;
}

export function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): Point {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Creates SVG Path for an annular pie wedge (between innerRadius and outerRadius, from startAngle to endAngle)
 */
export function createSectorPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  totalSectors = 8
): string {
  // Dynamically calculate gap angle so many sectors don't eat into slice area
  const sectorSpan = endAngle - startAngle;
  const gapAngle = Math.min(1.2, Math.max(0.35, sectorSpan * 0.035));

  const adjustedStart = startAngle + gapAngle;
  const adjustedEnd = endAngle - gapAngle;

  if (adjustedEnd <= adjustedStart) {
    return '';
  }

  const outerStart = polarToCartesian(centerX, centerY, outerRadius, adjustedStart);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, adjustedEnd);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, adjustedEnd);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, adjustedStart);

  const largeArcFlag = adjustedEnd - adjustedStart <= 180 ? 0 : 1;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/**
 * Given mouse coordinates relative to center, returns:
 * - distance from center
 * - angle in degrees [0, 360) where 0 is 12 o'clock (North)
 */
export function getPointerPolar(dx: number, dy: number): { distance: number; angleDegrees: number } {
  const distance = Math.hypot(dx, dy);
  let angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 to 180, 0 is right (East)
  
  // Transform so 0 is Up (North), clockwise
  angle = angle + 90;
  if (angle < 0) {
    angle += 360;
  }
  return { distance, angleDegrees: angle };
}

/**
 * Determine which sector is active based on angle
 * Sector 0 is centered around 12 o'clock (0 degrees)
 */
export function getSectorIndexForAngle(angleDegrees: number, sectorCount: number): number {
  if (sectorCount <= 0) return 0;
  const sectorSpan = 360 / sectorCount;
  // Offset by half sector span so sector 0 is centered vertically at top
  const shiftedAngle = (angleDegrees + sectorSpan / 2) % 360;
  return Math.floor(shiftedAngle / sectorSpan);
}

/**
 * Get sector center angle for positioning icons/labels
 */
export function getSectorCenterAngle(index: number, sectorCount: number): number {
  const sectorSpan = 360 / sectorCount;
  return index * sectorSpan;
}

/**
 * Get adaptive sizing for icons and typography depending on slot count
 */
export function getAdaptiveSizing(totalSectors: number) {
  if (totalSectors <= 6) {
    return { iconSize: 22, fontSize: 11.5, badgeSize: 10, labelOffset: 16 };
  }
  if (totalSectors <= 8) {
    return { iconSize: 20, fontSize: 11, badgeSize: 9, labelOffset: 14 };
  }
  if (totalSectors <= 12) {
    return { iconSize: 17, fontSize: 9.5, badgeSize: 8.5, labelOffset: 12 };
  }
  return { iconSize: 14, fontSize: 8.5, badgeSize: 7.5, labelOffset: 10 };
}
