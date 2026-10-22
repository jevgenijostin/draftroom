import { players, positions } from "./players";
export const teamNames = [
  "Your franchise",
  "Midnight Owls",
  "Fourth & Long",
  "Sunday Syndicate",
  "Red Zone Club",
  "The Wildcards",
  "Gridiron Union",
  "Endzone Theory",
  "Pocket Aces",
  "Hail Marys",
  "Iron City",
  "The Playmakers",
  "Route Runners",
  "Goal Line Gang",
  "Blitz Society",
  "Overtime Club",
];
export const defaultWeights = Object.fromEntries(positions.map((p) => [p, 1]));
export const targets = { QB: 2, RB: 5, WR: 5, TE: 1, K: 1, DEF: 1 };
export function snakeOrder(teams, rounds) {
  if (
    !Number.isInteger(teams) ||
    teams < 4 ||
    teams > 16 ||
    !Number.isInteger(rounds) ||
    rounds < 1 ||
    rounds > 20
  )
    throw new Error("Invalid draft dimensions");
  return Array.from({ length: teams * rounds }, (_, i) =>
    Math.floor(i / teams) % 2 ? teams - 1 - (i % teams) : i % teams,
  );
}
export function aiScore(p, roster, weights = defaultWeights) {
  const count = roster.filter((r) => r.position === p.position).length;
  const need =
    count >= targets[p.position]
      ? 0.12 / (1 + count - targets[p.position])
      : count === 0
        ? 1.12
        : 0.86;
  return p.value * need * (weights[p.position] ?? 1);
}
export function aiPick(pool, roster = [], weights = defaultWeights) {
  return (
    [...pool].sort(
      (a, b) =>
        aiScore(b, roster, weights) - aiScore(a, roster, weights) ||
        a.rank - b.rank,
    )[0] ?? null
  );
}
export function createDraft(config, keepers = []) {
  const order = snakeOrder(config.teams, config.rounds);
  const rosters = Array.from({ length: config.teams }, (_, i) =>
    keepers[i] ? [...keepers[i]] : [],
  );
  const held = new Set(rosters.flat().map((p) => p.id));
  return {
    config,
    order,
    rosters,
    picks: [],
    available: players.filter((p) => !held.has(p.id)),
    done: false,
  };
}
export function makePick(state, id, source = "manual") {
  if (state.done) return state;
  const player = state.available.find((p) => p.id === id);
  if (!player) return state;
  const team = state.order[state.picks.length];
  const best = aiPick(state.available, state.rosters[team]);
  const efficiency = Math.min(
    1,
    aiScore(player, state.rosters[team]) / aiScore(best, state.rosters[team]),
  );
  const pick = {
    ...player,
    teamIndex: team,
    number: state.picks.length + 1,
    efficiency,
    source,
  };
  const picks = [...state.picks, pick];
  return {
    ...state,
    picks,
    available: state.available.filter((p) => p.id !== id),
    rosters: state.rosters.map((r, i) => (i === team ? [...r, pick] : r)),
    done: picks.length === state.order.length,
  };
}
export function gradeTeam(picks) {
  const score = picks.length
    ? Math.round(
        (100 * picks.reduce((s, p) => s + p.efficiency, 0)) / picks.length,
      )
    : 0;
  const letter =
    score >= 93
      ? "A"
      : score >= 83
        ? "B"
        : score >= 73
          ? "C"
          : score >= 60
            ? "D"
            : "F";
  return {
    score,
    letter,
    explanation:
      score >= 93
        ? "Excellent value, with positional needs kept in balance."
        : score >= 83
          ? "A strong foundation. A few reaches left value on the board."
          : score >= 73
            ? "Room to improve: balance positional depth with available value."
            : "Frequent reaches or repeated positions cost this roster value.",
  };
}
export function reorder(queue, from, to) {
  const copy = [...queue];
  const a = copy.indexOf(from),
    b = copy.indexOf(to);
  if (a < 0 || b < 0) return copy;
  copy.splice(b, 0, copy.splice(a, 1)[0]);
  return copy;
}
