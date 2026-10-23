import type { ReactNode } from "react";
import { barRects, scalePoints, toAreaPath, toPolyline } from "../../lib/chart";

/**
 * Hand-rolled svg charts on the ADR-03 token system: no chart
 * library, one accent hue, dashed neutrals, tabular captions.
 * Current color rides on the text color of the svg element.
 */

const VIEW_W = 560;

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
  ariaLabel,
  height = 96,
}: {
  values: number[];
  ariaLabel: string;
  height?: number;
}) {
  const pts = scalePoints(values, VIEW_W, height);
  return (
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
  );
}

export function BarChart({
  values,
  ariaLabel,
  height = 96,
  format = (v: number) => String(Math.round(v * 100) / 100),
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
  );
}
