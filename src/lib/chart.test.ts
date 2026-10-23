import { describe, it, expect } from "vitest";
import {
  scalePoints,
  toPolyline,
  toAreaPath,
  barRects,
  flowBarRects,
  labelIndices,
} from "./chart";

describe("scalePoints", () => {
  it("returns empty for an empty series", () => {
    expect(scalePoints([], 100, 40)).toEqual([]);
  });

  it("centers a single point", () => {
    const [pt] = scalePoints([5], 100, 40);
    expect(pt.x).toBe(50);
    expect(pt.y).toBe(20);
  });

  it("renders a flat series as a centered line, not NaN", () => {
    const pts = scalePoints([3, 3, 3], 100, 40);
    pts.forEach((p) => {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.y).toBeCloseTo(20, 5);
    });
  });

  it("maps a rising series left-low to right-high in svg space (y inverted)", () => {
    const pts = scalePoints([0, 50, 100], 102, 42);
    expect(pts[0].x).toBeCloseTo(2, 5);
    expect(pts[2].x).toBeCloseTo(100, 5);
    expect(pts[0].y).toBeGreaterThan(pts[2].y);
  });

  it("stays inside the padded box", () => {
    const pts = scalePoints([1, 2, 3, 100], 100, 40, 3);
    pts.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(3);
      expect(p.x).toBeLessThanOrEqual(97);
      expect(p.y).toBeGreaterThanOrEqual(3);
      expect(p.y).toBeLessThanOrEqual(37);
    });
  });
});

describe("toPolyline", () => {
  it("formats points for an svg points attribute", () => {
    expect(
      toPolyline([
        { x: 0, y: 10.5678 },
        { x: 50, y: 20 },
      ]),
    ).toBe("0,10.57 50,20");
  });
});

describe("toAreaPath", () => {
  it("closes the line down to the baseline", () => {
    const d = toAreaPath(
      [
        { x: 2, y: 4 },
        { x: 50, y: 6 },
      ],
      40,
    );
    expect(d.startsWith("M2,4")).toBe(true);
    expect(d).toContain("L50,6");
    expect(d).toContain("L50,39");
    expect(d).toContain("L2,39");
    expect(d.endsWith("Z")).toBe(true);
  });

  it("returns an empty path for no points", () => {
    expect(toAreaPath([], 40)).toBe("");
  });
});

describe("barRects", () => {
  it("sizes positive bars from the zero baseline", () => {
    const rects = barRects([10, 20], 100, 40);
    expect(rects).toHaveLength(2);
    expect(rects[1].h).toBeGreaterThan(rects[0].h);
    rects.forEach((r) => {
      expect(r.y + r.h).toBeCloseTo(38, 5); // zero line at the bottom pad
    });
  });

  it("places negative bars below the zero line", () => {
    const [rect] = barRects([-10], 100, 40);
    expect(rect.y).toBeCloseTo(2, 5); // zero line at the top for an all-negative series
    expect(rect.h).toBeCloseTo(36, 5);
  });

  it("returns empty for no values", () => {
    expect(barRects([], 100, 40)).toEqual([]);
  });
});

describe("flowBarRects", () => {
  it("anchors the reward at zero and stacks delegation out to the total", () => {
    // reward 10, delegation +5: bar spans zero..15, reward below, delegation on top
    const { zeroY, bars } = flowBarRects([10], [5], 100, 40);
    expect(bars).toHaveLength(1);
    const [bar] = bars;
    expect(bar.reward.y + bar.reward.h).toBeCloseTo(zeroY, 5); // reward sits on the zero line
    expect(bar.delegation.y + bar.delegation.h).toBeCloseTo(bar.reward.y, 5); // delegation stacks on the reward tip
    expect(bar.delegation.y).toBeCloseTo(2, 5); // outer edge = the total change (+15)
  });

  it("keeps the total on the bar's outer edge when delegations go negative", () => {
    // reward 5, unstake -10: total -5; bar crosses the zero line, tip at -5
    const { zeroY, bars } = flowBarRects([5], [-10], 100, 40);
    const [bar] = bars;
    expect(bar.delegation.y + bar.delegation.h).toBeCloseTo(zeroY + 18, 5); // tip = total (-5)
    expect(bar.reward.y + bar.reward.h).toBeCloseTo(zeroY, 5); // reward still hugs zero
  });

  it("returns no bars for mismatched or empty inputs", () => {
    expect(flowBarRects([], [], 100, 40).bars).toEqual([]);
    expect(flowBarRects([1], [1, 2], 100, 40).bars).toEqual([]);
  });
});

describe("labelIndices", () => {
  it("labels every slot up to the max", () => {
    expect(labelIndices(4)).toEqual([0, 1, 2, 3]);
    expect(labelIndices(12)).toHaveLength(12);
  });

  it("thins past the max while keeping both ends", () => {
    const idx = labelIndices(20);
    expect(idx.length).toBeLessThanOrEqual(12);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(19);
    expect(new Set(idx).size).toBe(idx.length); // no duplicates
  });

  it("handles the degenerate cases", () => {
    expect(labelIndices(0)).toEqual([]);
    expect(labelIndices(20, 1)).toEqual([19]);
  });
});
