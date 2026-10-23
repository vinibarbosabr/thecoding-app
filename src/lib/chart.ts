/**
 * Pure scale-and-path math for the hand-rolled svg charts. No
 * dependencies, no color decisions here: components own tokens.
 */

export type Pt = { x: number; y: number };

export function scalePoints(
  values: number[],
  width: number,
  height: number,
  pad = 2,
): Pt[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  // flat series renders as a centered line, never a division by zero
  const lo = span === 0 ? min - 1 : min - span * 0.08;
  const hi = span === 0 ? max + 1 : max + span * 0.08;
  const innerW = Math.max(width - pad * 2, 0);
  const innerH = Math.max(height - pad * 2, 0);
  return values.map((v, i) => ({
    x: pad + (values.length === 1 ? innerW / 2 : (innerW * i) / (values.length - 1)),
    y: pad + innerH - ((v - lo) / (hi - lo)) * innerH,
  }));
}

export function toPolyline(points: Pt[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

/** Line path plus a close down to the baseline for an area fill. */
export function toAreaPath(points: Pt[], height: number): string {
  if (points.length === 0) return "";
  const base = height - 1;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)},${round(p.y)}`);
  d.push(`L${round(points[points.length - 1].x)},${base}`);
  d.push(`L${round(points[0].x)},${base}`);
  d.push("Z");
  return d.join(" ");
}

export type BarRect = { x: number; y: number; w: number; h: number };

export function barRects(
  values: number[],
  width: number,
  height: number,
  gap = 1,
  pad = 2,
): BarRect[] {
  if (values.length === 0) return [];
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const innerH = Math.max(height - pad * 2, 0);
  const base = pad + innerH - ((0 - min) / span) * innerH;
  const barW = Math.max((width - pad * 2 - gap * (values.length - 1)) / values.length, 0.5);
  const scale = (v: number) => ((v - min) / span) * innerH;
  return values.map((v, i) => {
    const zeroBase = Math.min(base, pad + innerH);
    const h = Math.abs(scale(v) - scale(0));
    return {
      x: pad + i * (barW + gap),
      y: v >= 0 ? zeroBase - h : zeroBase,
      w: barW,
      h,
    };
  });
}

/**
 * Stacked per-epoch stake-change bars: the reward segment is anchored
 * at the zero line (rewards are positive auto-compound), the delegation
 * segment stacks outward from the reward tip to the total change, so
 * every bar's outer edge reads as the epoch's total stake change.
 * total = reward + delegation per bar; shared y domain.
 */
export type FlowBarRect = {
  x: number;
  w: number;
  reward: { y: number; h: number };
  delegation: { y: number; h: number };
};

export function flowBarRects(
  rewards: number[],
  delegations: number[],
  width: number,
  height: number,
  gap = 1,
  pad = 2,
): { zeroY: number; bars: FlowBarRect[] } {
  const n = rewards.length;
  if (n === 0 || delegations.length !== n) return { zeroY: height - pad, bars: [] };
  const totals = rewards.map((r, i) => r + delegations[i]);
  const min = Math.min(0, ...totals);
  const max = Math.max(0, ...rewards, ...totals);
  const span = max - min || 1;
  const innerH = Math.max(height - pad * 2, 0);
  const yAt = (v: number) => pad + innerH - ((v - min) / span) * innerH;
  const zeroY = yAt(0);
  const barW = Math.max((width - pad * 2 - gap * (n - 1)) / n, 0.5);
  const bars = rewards.map((reward, i) => {
    const total = totals[i];
    return {
      x: pad + i * (barW + gap),
      w: barW,
      reward: {
        y: Math.min(yAt(reward), zeroY),
        h: Math.abs(yAt(reward) - zeroY),
      },
      delegation: {
        y: Math.min(yAt(total), yAt(reward)),
        h: Math.abs(yAt(total) - yAt(reward)),
      },
    };
  });
  return { zeroY, bars };
}

/**
 * Evenly spread label slots for a value row of n points, keeping both
 * ends and never more than max labels (duplicates collapse as the
 * series grows).
 */
export function labelIndices(n: number, max = 12): number[] {
  if (n <= 0) return [];
  if (n <= max) return Array.from({ length: n }, (_, i) => i);
  if (max <= 1) return [n - 1];
  const count = Math.min(max, n);
  const seen = new Set(
    Array.from({ length: count }, (_, i) => Math.round((i * (n - 1)) / (count - 1))),
  );
  return [...seen];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
