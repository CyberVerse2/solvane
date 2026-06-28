import { describe, it, expect } from "vitest";
import { shortAddr, fmtAmount, fmtUsd, timeAgo } from "./utils";

describe("shortAddr", () => {
  it("truncates a long Stellar address", () => {
    expect(shortAddr("CBLLJCP2N2TB4LJYEUGTN3NHPF7T5HZITFOBCGYEUDYFZYU4JDDVR4DB")).toBe(
      "CBLL…R4DB",
    );
  });
  it("respects custom lead/tail", () => {
    expect(shortAddr("GABCDEF12345", 3, 3)).toBe("GAB…345");
  });
  it("leaves short strings untouched", () => {
    expect(shortAddr("GABC")).toBe("GABC");
  });
});

describe("fmtAmount / fmtUsd", () => {
  it("adds thousands separators", () => {
    expect(fmtAmount(1234567.5)).toBe("1,234,567.50");
  });
  it("formats USD", () => {
    expect(fmtUsd(4280.5)).toBe("$4,280.50");
  });
});

describe("timeAgo", () => {
  it("reports seconds for very recent timestamps", () => {
    const tenSecAgo = new Date(Date.now() - 10_000).toISOString();
    expect(timeAgo(tenSecAgo)).toMatch(/\ds ago/);
  });
  it("reports hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });
});
