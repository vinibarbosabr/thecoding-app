import { describe, it, expect } from "vitest";
import { parseRoute, useHashRoute } from "./useHashRoute";

describe("parseRoute", () => {
  it("reads the empty hash as the hub", () => {
    expect(parseRoute("")).toBe("");
  });

  it("reads the bare hash as the hub", () => {
    expect(parseRoute("#")).toBe("");
  });

  it("reads #/data as the data view", () => {
    expect(parseRoute("#/data")).toBe("data");
  });

  it("tolerates #data without the slash", () => {
    expect(parseRoute("#data")).toBe("data");
  });

  it("ignores query strings and trailing paths", () => {
    expect(parseRoute("#/data?x=1")).toBe("data");
    expect(parseRoute("#/data/epochs")).toBe("data");
  });

  it("treats unknown segments as non-hub routes", () => {
    expect(parseRoute("#/whatever")).toBe("whatever");
  });

  it("hook exports without crashing", () => {
    expect(typeof useHashRoute).toBe("function");
  });
});
