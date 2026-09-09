import { describe, expect, it } from "bun:test";
import { decodeManageToken, encodeManageToken } from "./manage-link";

describe("manage-link", () => {
  it("roundtrip and rejects a foreign academy", () => {
    const token = encodeManageToken("academy-a", "booking-1");
    expect(decodeManageToken("academy-a", token)).toBe("booking-1");
    expect(decodeManageToken("academy-b", token)).toBeNull();
    expect(decodeManageToken("academy-a", "booking-1.nope")).toBeNull();
  });
});
