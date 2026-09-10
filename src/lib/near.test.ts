import { describe, it, expect } from "vitest";
import { nearToYocto, yoctoToNear, normalizeDecimal, formatNear } from "./near";

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
