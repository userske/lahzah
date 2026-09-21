import React from 'react';
import Svg, { Circle, Path, G, Line } from 'react-native-svg';

/**
 * Authored marks, drawn as exact geometry in one stroke weight.
 *
 * No icon library and no glyphs standing in for icons. Every mark here is
 * specifiable — arcs, circles, and regular polygons — so it belongs to the
 * folio's engraved-line grammar rather than to a generic UI set.
 */

const STROKE = 1.25;

interface MarkProps {
  size?: number;
  color: string;
  /** Overrides the shared stroke weight only where optical balance demands it. */
  weight?: number;
}

/** Points of a regular polygon inscribed in a circle, as an SVG polygon string. */
function polygon(cx: number, cy: number, r: number, sides: number, rotation = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * 2 * Math.PI) / sides;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

/**
 * The ayah rosette — the mark that closes a verse in a mushaf.
 * Two squares at 45° inside a circle make the eight-point star.
 */
export function Rosette({ size = 16, color, weight = STROKE }: MarkProps) {
  const c = size / 2;
  const r = c - weight;
  const star = r * 0.74;
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={weight} />
      <Path d={polygon(c, c, star, 4, 0)} fill="none" stroke={color} strokeWidth={weight} />
      <Path d={polygon(c, c, star, 4, Math.PI / 4)} fill="none" stroke={color} strokeWidth={weight} />
    </Svg>
  );
}

/**
 * The seal — attestation. Concentric rings with radial ticks, the way a stamp
 * is cut. Carries the chain of days.
 */
export function Seal({ size = 16, color, weight = STROKE }: MarkProps) {
  const c = size / 2;
  const outer = c - weight;
  const inner = outer * 0.5;
  const ticks = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ticks.push(
      <Line
        key={i}
        x1={c + inner * Math.cos(a)}
        y1={c + inner * Math.sin(a)}
        x2={c + outer * Math.cos(a)}
        y2={c + outer * Math.sin(a)}
        stroke={color}
        strokeWidth={weight * 0.8}
      />,
    );
  }
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={outer} fill="none" stroke={color} strokeWidth={weight} />
      <Circle cx={c} cy={c} r={inner} fill="none" stroke={color} strokeWidth={weight} />
      <G>{ticks}</G>
    </Svg>
  );
}

/**
 * The arch — a miniature of the plate the whole folio is built from.
 * Marks the place you return to.
 */
export function ArchMark({ size = 16, color, weight = STROKE }: MarkProps) {
  const w = size - weight;
  const h = size - weight;
  const springing = h * 0.46;
  const radius = w * 0.72;
  const d =
    `M ${weight / 2} ${h}` +
    ` L ${weight / 2} ${springing}` +
    ` A ${radius} ${radius} 0 0 1 ${w / 2 + weight / 2} ${weight / 2}` +
    ` A ${radius} ${radius} 0 0 1 ${w + weight / 2} ${springing}` +
    ` L ${w + weight / 2} ${h}`;
  return (
    <Svg width={size} height={size}>
      <Path d={d} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="square" />
    </Svg>
  );
}

/**
 * The crescent — the Hijri date's mark. One disc subtracted from another,
 * resolved with the even-odd fill rule rather than drawn by hand.
 */
export function Crescent({ size = 16, color }: MarkProps) {
  const c = size / 2;
  const r = c * 0.92;
  const offset = r * 0.42;
  const disc = (cx: number, rr: number) =>
    `M ${cx - rr} ${c}` +
    ` a ${rr} ${rr} 0 1 0 ${rr * 2} 0` +
    ` a ${rr} ${rr} 0 1 0 ${-rr * 2} 0`;
  return (
    <Svg width={size} height={size}>
      <Path d={`${disc(c, r)} ${disc(c + offset, r * 0.92)}`} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
