import { it, expect, describe } from "vitest";
import {
  generateLicense,
  verifyLicense,
  canStart,
  allowedConfig,
  localDate,
} from "../src/license";
const demo =
  "DR1.d7550c16fc2eeeaaec5d2bf2970ef998902f6989269e6bf70f8bf51f3f379577";
describe("HMAC license", () => {
  it("verifies the published demo key", async () =>
    expect(await verifyLicense(demo)).toBe(true));
  it("generates a reproducible signed license", async () =>
    expect(await generateLicense()).toBe(demo));
  it.each([
    "",
    "pro",
    "DR1.bad",
    demo.slice(0, -1) + "8",
    demo.replace("DR1", "DR2"),
  ])("rejects malformed or tampered key %s", async (key) =>
    expect(await verifyLicense(key)).toBe(false),
  );
});
describe("free tier", () => {
  it("allows the first draft", () =>
    expect(canStart(false, null, "2026-10-22")).toBe(true));
  it("blocks a second draft on the same date", () =>
    expect(canStart(false, "2026-10-22", "2026-10-22")).toBe(false));
  it("allows another draft tomorrow", () =>
    expect(canStart(false, "2026-10-22", "2026-10-23")).toBe(true));
  it("does not limit Pro drafts", () =>
    expect(canStart(true, "2026-10-22", "2026-10-22")).toBe(true));
  it("uses the local calendar date", () =>
    expect(localDate(new Date(2026, 0, 2, 23, 59))).toBe("2026-01-02"));
  it("allows an eight-team free league", () =>
    expect(allowedConfig(false, { teams: 8, rounds: 15, clock: 30 })).toBe(
      true,
    ));
  it.each([4, 6, 10, 16])("blocks a free %s-team league", (teams) =>
    expect(allowedConfig(false, { teams, rounds: 15, clock: 30 })).toBe(false),
  );
  it.each([4, 8, 12, 16])("allows a Pro %s-team league", (teams) =>
    expect(allowedConfig(true, { teams, rounds: 15, clock: 30 })).toBe(true),
  );
  it("blocks keeper mode for free", () =>
    expect(
      allowedConfig(false, { teams: 8, rounds: 15, clock: 30, keeper: true }),
    ).toBe(false));
  it.each([
    { teams: 17, rounds: 15, clock: 30 },
    { teams: 8, rounds: 21, clock: 30 },
    { teams: 8, rounds: 15, clock: 0 },
    { teams: 8.5, rounds: 15, clock: 30 },
  ])("rejects invalid paid configurations", (config) =>
    expect(allowedConfig(true, config)).toBe(false),
  );
});
