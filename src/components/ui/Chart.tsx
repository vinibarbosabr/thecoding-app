import type { ReactNode } from "react";
import {
  barRects,
  flowBarRects,
  labelIndices,
  scalePoints,
  toAreaPath,
  toPolyline,
} from "../../lib/chart";

/**
 * Hand-rolled svg charts on the ADR-03 token system: no chart
 * library, one accent hue, dashed neutrals, tabular captions.
 * Current color rides on the text color of the svg element.
 */

const VIEW_W = 560;

const DEFAULT_FORMAT = (v: number) => String(Math.round(v * 100) / 100);

function ValueRow({
  values,
  format,
}: {
  values: number[];
  format: (v: number) => string;
}) {
  if (values.length === 0) return null;
  const shown = new Set(labelIndices(values.length));
  return (
    <div className="mt-1 flex font-mono text-[10px] leading-[1.5] text-ink-60 tabular-nums">
      {values.map((v, i) => (
        <span key={i} className="min-w-0 flex-1 text-center whitespace-nowrap">
          {shown.has(i) ? format(v) : ""}
        </span>
      ))}
    </div>
  );
}

export function ChartCaption({
  left,
  right,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <figcaption className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 font-mono text-[10px] leading-[1.5] text-ink-40">
      <span>{left}</span>
      {children}
      <span>{right}</span>
    </figcaption>
  );
}

export function LineChart({
  values,
  labels,
  ariaLabel,
  height = 96,
}: {
  values: number[];
  labels?: string[];
  ariaLabel: string;
  height?: number;
}) {
  const pts = scalePoints(values, VIEW_W, height);
  const ends =
    labels !== undefined &&
    labels.length === values.length &&
    labels.length > 0
      ? { first: labels[0], last: labels[labels.length - 1] }
      : null;
  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="block w-full text-signal-ink"
        style={{ height }}
      >
        {pts.length > 1 ? (
          <>
            <path d={toAreaPath(pts, height)} fill="currentColor" fillOpacity={0.08} />
            <polyline
              points={toPolyline(pts)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </svg>
      {ends ? (
        <div className="mt-1 flex items-baseline justify-between gap-x-3 font-mono text-[10px] leading-[1.5] text-ink-60 tabular-nums">
          <span className="text-left whitespace-nowrap">{ends.first}</span>
          <span className="text-right whitespace-nowrap">{ends.last}</span>
        </div>
      ) : null}
    </div>
  );
}

export function BarChart({
  values,
  ariaLabel,
  height = 96,
  format = DEFAULT_FORMAT,
}: {
  values: number[];
  ariaLabel: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const rects = barRects(values, VIEW_W, height);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const innerH = Math.max(height - 4, 0);
  const zeroY = 2 + innerH - ((0 - min) / span) * innerH;
  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="block w-full"
        style={{ height }}
      >
        {values.some((v) => v < 0) ? (
          <line
            x1={0}
            x2={VIEW_W}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            className="text-ink-25"
            strokeWidth={1}
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={Math.max(r.h, 0.75)}
            fill="currentColor"
            className={values[i] < 0 ? "text-ink-40" : "text-signal-ink"}
            fillOpacity={0.85}
          >
            <title>{format(values[i])}</title>
          </rect>
        ))}
      </svg>
      <ValueRow values={values} format={format} />
    </div>
  );
}

/**
 * Per-epoch stake change as two stacked segments: the reward block
 * hugs the zero line (accent), delegations stack outward from it
 * (dimmer), so each bar's outer edge is the epoch's total change.
 */
export function StackedFlowChart({
  rewards,
  delegations,
  ariaLabel,
  height = 96,
  format = DEFAULT_FORMAT,
}: {
  rewards: number[];
  delegations: number[];
  ariaLabel: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const { zeroY, bars } = flowBarRects(rewards, delegations, VIEW_W, height);
  const totals = rewards.map((r, i) => r + delegations[i]);
  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="block w-full"
        style={{ height }}
      >
        {totals.some((t) => t < 0) ? (
          <line
            x1={0}
            x2={VIEW_W}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            className="text-ink-25"
            strokeWidth={1}
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {bars.map((r, i) => (
          <g key={i}>
            <title>
              stake change {format(totals[i])} · reward {format(rewards[i])} ·
              delegations {format(delegations[i])}
            </title>
            <rect
              x={r.x}
              y={r.delegation.y}
              width={r.w}
              height={Math.max(r.delegation.h, 0.75)}
              fill="currentColor"
              className={delegations[i] < 0 ? "text-ink-40" : "text-signal-ink"}
              fillOpacity={delegations[i] < 0 ? 0.85 : 0.45}
            />
            <rect
              x={r.x}
              y={r.reward.y}
              width={r.w}
              height={Math.max(r.reward.h, 0.75)}
              fill="currentColor"
              className="text-signal-ink"
              fillOpacity={0.85}
            />
          </g>
        ))}
      </svg>
      <ValueRow values={totals} format={format} />
    </div>
  );
}
