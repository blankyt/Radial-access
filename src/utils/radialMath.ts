/**
 * Geometry & Math helpers for Radial Wheel / Pie Slices
 * Implements dynamic single-ring (4-12) & dual concentric ring (13-16) layouts
 * with half-step offset, hysteresis, and fallbacks.
 */

export interface Point {
  x: number;
  y: number;
}

export const DEAD_ZONE = 28;     // px, center hub, no selection
export const INNER_MIN = 42;     // px, inner ring starts
export const INNER_MAX = 130;    // px, inner ring ends here
export const OUTER_MAX = 210;    // px, outer ring ends here

/**
 * Measure angles clockwise from the top (0 = North/Up, clockwise positive)
 * dy is positive downward in screen coordinates
 */
export function angleFromTop(dx: number, dy: number): number {
  const a = Math.atan2(dx, -dy); // 0 = up, clockwise positive
  return (a % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
}

/**
 * Returns sector index centered on "up" (half-step offset)
 * so slot 0 is centered on "up", not starting at it.
 */
export function sectorIndex(dx: number, dy: number, n: number): number {
  if (n <= 0) return 0;
  const step = (2 * Math.PI) / n;
  const a = (angleFromTop(dx, dy) + step / 2) % (2 * Math.PI);
  return Math.floor(a / step) % n;
}

/**
 * Scales the radius with N so targets stay at least ~48 px wide
 */
export function ringRadius(n: number, minArc: number = 48): number {
  return Math.max(120, (n * minArc) / (2 * Math.PI));
}

/**
 * Returns (x, y) relative to center for slot i
 */
export function slotCenter(i: number, n: number, radius: number): Point {
  const step = (2 * Math.PI) / n;
  const a = i * step;
  return {
    x: radius * Math.sin(a),
    y: -radius * Math.cos(a),
  };
}

/**
 * Two-ring hit testing with hysteresis and empty outer slot fallback:
 * 4 to 8: Single ring
 * 9 to 12: Single ring with scaled larger radius
 * 13 to 16: Two rings (8 sectors inner + rest outer)
 */
export function hitTest(
  dx: number,
  dy: number,
  totalSlots: number,
  currentHover: number | null = null,
  layoutMode: 'auto' | 'single' | 'dual' = 'auto'
): number | null {
  const dist = Math.hypot(dx, dy);
  if (dist < DEAD_ZONE) {
    return null; // hub area
  }

  const isDual = layoutMode === 'dual' || (layoutMode === 'auto' && totalSlots > 12);

  if (!isDual) {
    const maxR = ringRadius(totalSlots) + 45;
    if (dist > maxR) return null;
    return sectorIndex(dx, dy, totalSlots);
  }

  // Dual Concentric Ring (8 sectors x 2 depths)
  if (dist > OUTER_MAX + 45) {
    return null; // Outside outer ring
  }

  const sectors = 8;
  const s = sectorIndex(dx, dy, sectors);
  const ring = dist < INNER_MAX ? 0 : 1; // 0 = inner, 1 = outer
  const candidate = s + ring * sectors;

  // Hysteresis: don't switch highlighted slot until pointer is ~3.5° past boundary
  if (currentHover !== null && candidate !== currentHover) {
    const step = (2 * Math.PI) / sectors;
    const a = (angleFromTop(dx, dy) + step / 2) % (2 * Math.PI);
    const boundaryDist = a % step;
    const hystMargin = step * 0.08; // ~3.6 degrees
    if (boundaryDist < hystMargin || boundaryDist > step - hystMargin) {
      const prevRing = currentHover >= 8 ? 1 : 0;
      if (prevRing === ring) {
        return currentHover;
      }
    }
  }

  // Fall back to inner if outer slot is empty or beyond total_slots
  return candidate < totalSlots ? candidate : s;
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
  const sectorSpan = endAngle - startAngle;
  const gapAngle = Math.min(1.2, Math.max(0.3, sectorSpan * 0.035));

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
  return Math.floor(shiftedAngle / sectorSpan) % sectorCount;
}

/**
 * Get sector center angle for positioning icons/labels
 */
export function getSectorCenterAngle(index: number, sectorCount: number): number {
  const sectorSpan = 360 / sectorCount;
  return index * sectorSpan;
}

/**
 * Get adaptive sizing for icons and typography depending on slot count & ring depth
 */
export function getAdaptiveSizing(totalSectors: number, isDualRing = false, ring: 0 | 1 = 0) {
  if (isDualRing) {
    if (ring === 0) {
      // Inner ring (8 sectors, radius 46-126)
      return { iconSize: 18, fontSize: 10, badgeSize: 8, labelOffset: 12 };
    }
    // Outer ring (8 sectors, radius 132-208)
    return { iconSize: 19, fontSize: 10.5, badgeSize: 8.5, labelOffset: 13 };
  }

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
