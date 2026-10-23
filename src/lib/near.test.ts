import { describe, it, expect } from "vitest";
import {
  nearToYocto,
  yoctoToNear,
  normalizeDecimal,
  formatNear,
  formatNearCompact,
  formatDeltaYocto,
} from "./near";

describe("normalizeDecimal", () => {
  it("accepts dot decimal", () => {
    expect(normalizeDecimal("1.5")).toBe(1.5);
  });

  it("accepts comma decimal", () => {
    expect(normalizeDecimal("1,5")).toBe(1.5);
  });

  it("accepts integer", () => {
    expect(normalizeDecimal("42")).toBe(42);
  });

  it("trims whitespace", () => {
    expect(normalizeDecimal("  1.5  ")).toBe(1.5);
  });

  it("rejects empty", () => {
    expect(Number.isNaN(normalizeDecimal(""))).toBe(true);
  });

  it("rejects non-numeric", () => {
    expect(Number.isNaN(normalizeDecimal("abc"))).toBe(true);
  });

  it("rejects double dots", () => {
    expect(Number.isNaN(normalizeDecimal("1.5.5"))).toBe(true);
  });
});

describe("nearToYocto", () => {
  it("converts whole NEAR", () => {
    expect(nearToYocto("1")).toBe("1000000000000000000000000");
  });

  it("converts 0.1 NEAR (dogfood amount)", () => {
    expect(nearToYocto("0.1")).toBe("100000000000000000000000");
  });

  it("converts fractional with full precision", () => {
    expect(nearToYocto("1.5")).toBe("1500000000000000000000000");
  });

  it("rejects zero", () => {
    expect(() => nearToYocto("0")).toThrow();
  });

  it("rejects empty", () => {
    expect(() => nearToYocto("")).toThrow();
  });

  it("accepts comma input", () => {
    expect(nearToYocto("1,5")).toBe("1500000000000000000000000");
  });
});

describe("yoctoToNear", () => {
  it("converts 1 NEAR yocto", () => {
    expect(yoctoToNear("1000000000000000000000000")).toBe(1);
  });

  it("converts 0", () => {
    expect(yoctoToNear("0")).toBe(0);
  });

  it("converts fractional", () => {
    expect(yoctoToNear("1500000000000000000000000")).toBe(1.5);
  });

  it("handles empty string as 0", () => {
    expect(yoctoToNear("")).toBe(0);
  });
});

describe("formatNear", () => {
  it("formats 1 NEAR", () => {
    expect(formatNear("1000000000000000000000000")).toBe("1");
  });

  it("formats fractional with trailing zero removal", () => {
    const out = formatNear("1500000000000000000000000");
    expect(out).toBe("1.5");
  });

  it("formats 0", () => {
    expect(formatNear("0")).toBe("0");
  });
});

describe("formatNearCompact", () => {
  it("formats network-scale staked sums as millions", () => {
    // live epoch 4894: 592,863,197.1246 near
    expect(formatNearCompact("592863197124683768986714673190623")).toBe(
      "592.86m",
    );
  });

  it("formats circulating supply as billions", () => {
    expect(formatNearCompact("1249836992159308065117756741322730")).toBe(
      "1.25b",
    );
  });

  it("formats pool-scale stakes as thousands", () => {
    expect(formatNearCompact("432211374493686841346346634543")).toBe("432.21k");
  });

  it("falls back to formatNear below a thousand", () => {
    expect(formatNearCompact("1500000000000000000000000")).toBe("1.5");
  });
});

describe("formatDeltaYocto", () => {
  it("formats positive and negative deltas", () => {
    // live 4894 -> 4895 reward delta and net flow
    expect(formatDeltaYocto(17238613113198740904295785n)).toBe("+17.2386");
    expect(formatDeltaYocto(373401763187880264555367n)).toBe("+0.3734");
  });

  it("formats zero without a sign", () => {
    expect(formatDeltaYocto(0n)).toBe("0");
  });

  it("formats negatives with a leading minus", () => {
    expect(formatDeltaYocto(-373401763187880264555367n)).toBe("-0.3734");
  });
});
