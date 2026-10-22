import { describe, it, expect } from "vitest";
import {
  snakeOrder,
  aiPick,
  aiScore,
  createDraft,
  makePick,
  gradeTeam,
  reorder,
  defaultWeights,
} from "../src/engine";
import { players, positions } from "../src/players";
describe("snake order", () => {
  it("reverses every round, with consecutive turn picks", () =>
    expect(snakeOrder(4, 3)).toEqual([0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3]));
  it.each([4, 8, 12, 16])(
    "gives every team exactly 15 picks in a %s-team league",
    (n) => {
      const order = snakeOrder(n, 15);
      for (let i = 0; i < n; i++)
        expect(order.filter((x) => x === i)).toHaveLength(15);
    },
  );
  it.each([
    [3, 15],
    [17, 15],
    [8, 0],
    [8, 21],
    [8.5, 15],
    [8, 1.5],
  ])("rejects invalid dimensions %s/%s", (n, r) =>
    expect(() => snakeOrder(n, r)).toThrow(),
  );
});
describe("player pool", () => {
  it("has enough unique real-name entries for the maximum draft and keepers", () => {
    expect(players.length).toBeGreaterThanOrEqual(352);
    expect(new Set(players.map((p) => p.id)).size).toBe(players.length);
    expect(new Set(players.map((p) => p.name)).size).toBe(players.length);
  });
  it("contains all positions and valid ranked projections", () => {
    expect(new Set(players.map((p) => p.position))).toEqual(new Set(positions));
    players.forEach((p, i) => {
      expect(p.rank).toBe(i + 1);
      expect(p.points).toBeGreaterThan(0);
      expect(p.team).toMatch(/^[A-Z]{2,3}$/);
    });
  });
});
describe("opponent logic", () => {
  it("chooses the highest needs-adjusted value deterministically", () => {
    expect(aiPick(players).id).toBe("rb-1");
    expect(aiPick([...players].reverse()).id).toBe("rb-1");
  });
  it("penalizes excessive quarterbacks", () => {
    const qbs = players.filter((p) => p.position === "QB").slice(0, 2);
    const qb = players.find((p) => p.id === "qb-3");
    expect(aiScore(qb, qbs)).toBeLessThan(aiScore(qb, []) / 5);
    expect(
      aiPick(
        players.filter((p) => !qbs.includes(p)),
        qbs,
      ).position,
    ).not.toBe("QB");
  });
  it("custom weights change opponent preferences", () =>
    expect(aiPick(players, [], { ...defaultWeights, QB: 1.5 }).position).toBe(
      "QB",
    ));
  it("returns null for an empty pool", () => expect(aiPick([])).toBe(null));
  it("creates balanced full-length rosters", () => {
    let d = createDraft({ teams: 8, rounds: 15 });
    while (!d.done) {
      const t = d.order[d.picks.length];
      d = makePick(d, aiPick(d.available, d.rosters[t]).id, "AI");
    }
    for (const r of d.rosters) {
      expect(r.filter((p) => p.position === "QB").length).toBeLessThanOrEqual(
        2,
      );
      expect(
        r.filter((p) => p.position === "RB").length,
      ).toBeGreaterThanOrEqual(3);
      expect(
        r.filter((p) => p.position === "WR").length,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
describe("state transitions", () => {
  it("applies a pick immutably and prevents duplicate drafting", () => {
    const d = createDraft({ teams: 8, rounds: 15 });
    const next = makePick(d, "rb-1");
    expect(d.picks).toHaveLength(0);
    expect(next.rosters[0][0].id).toBe("rb-1");
    expect(next.available).toHaveLength(players.length - 1);
    expect(makePick(next, "rb-1")).toBe(next);
  });
  it("does not advance on unknown players", () => {
    const d = createDraft({ teams: 8, rounds: 15 });
    expect(makePick(d, "missing")).toBe(d);
  });
  it("completes the maximum draft without duplicate players or empty picks", () => {
    let d = createDraft({ teams: 16, rounds: 20 });
    while (!d.done) {
      const t = d.order[d.picks.length];
      d = makePick(d, aiPick(d.available, d.rosters[t]).id);
    }
    expect(d.picks).toHaveLength(320);
    expect(new Set(d.picks.map((p) => p.id)).size).toBe(320);
    expect(d.rosters.every((r) => r.length === 20)).toBe(true);
    expect(makePick(d, d.available[0].id)).toBe(d);
  });
  it("removes keeper players from the pool and keeps them on their teams", () => {
    const d = createDraft({ teams: 4, rounds: 15 }, [
      [players[0], players[1]],
      [players[2]],
    ]);
    expect(d.available).toHaveLength(players.length - 3);
    expect(d.rosters[0]).toHaveLength(2);
    expect(d.picks).toHaveLength(0);
  });
});
describe("grading", () => {
  it.each([
    [1, "A"],
    [0.93, "A"],
    [0.92, "B"],
    [0.83, "B"],
    [0.82, "C"],
    [0.73, "C"],
    [0.72, "D"],
    [0.6, "D"],
    [0.59, "F"],
  ])("grades efficiency %s as %s", (efficiency, letter) =>
    expect(gradeTeam([{ efficiency }]).letter).toBe(letter),
  );
  it("averages all pick efficiencies", () =>
    expect(gradeTeam([{ efficiency: 1 }, { efficiency: 0.6 }]).score).toBe(80));
  it("gives an unpicked roster zero", () =>
    expect(gradeTeam([]).score).toBe(0));
  it("records the counterfactual best available value at the pick", () => {
    const d = createDraft({ teams: 8, rounds: 15 });
    expect(makePick(d, "rb-1").picks[0].efficiency).toBe(1);
    expect(makePick(d, "k-32").picks[0].efficiency).toBeLessThan(0.3);
  });
});
describe("queue", () => {
  it("moves priority down without losing players", () =>
    expect(reorder(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]));
  it("moves priority up without mutating the original", () => {
    const q = ["a", "b", "c"];
    expect(reorder(q, "c", "a")).toEqual(["c", "a", "b"]);
    expect(q).toEqual(["a", "b", "c"]);
  });
  it("ignores stale player IDs", () =>
    expect(reorder(["a"], "gone", "a")).toEqual(["a"]));
});
