import { describe, it, expect } from "vitest";
import { truncateAccountId } from "./format";

describe("truncateAccountId", () => {
  it("leaves short ids intact", () => {
    expect(truncateAccountId("vini.near")).toBe("vini.near");
  });

  it("truncates long ids by the 6/4 rule regardless of type", () => {
    expect(truncateAccountId("thecoding.pool.near")).toBe("thecod…near");
  });

  it("truncates 0x implicit ids to head 6 + ellipsis + tail 4", () => {
    expect(truncateAccountId("0xf3f9a02b18c2e4c98f1b4e6a1b3d1fa06d33e07d1")).toBe(
      "0xf3f9…07d1",
    );
  });

  it("keeps ids at or below the visibility threshold intact", () => {
    expect(truncateAccountId("0123456789")).toBe("0123456789");
    expect(truncateAccountId("01234567890")).toBe("01234567890");
  });

  it("truncates one character past the threshold", () => {
    expect(truncateAccountId("012345678901")).toBe("012345…8901");
  });
});
