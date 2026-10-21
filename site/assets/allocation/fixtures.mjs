import {
  applicants,
  programs,
  match,
  scenario,
  feasibility,
  individuallyRational,
  noJustifiedEnvy,
  quotaChoice,
} from "./model.mjs";
const caps = Object.fromEntries(
  Object.entries(programs).map(([p, s]) => [p, s.capacity]),
);
const ensure = (condition, message) => {
  if (!condition) throw Error(message);
};
export const fixtures = [
  {
    name: "Capacity & unique assignment",
    scope: "Three applicants, three one-seat programs.",
    run() {
      const r = match(applicants, caps);
      ensure(
        feasibility(applicants, caps, r),
        "Overcapacity or duplicate assignment",
      );
    },
  },
  {
    name: "Individual rationality",
    scope: "Every matched program appears in that applicant’s acceptable list.",
    run() {
      ensure(
        individuallyRational(applicants, match(applicants, caps)),
        "Unacceptable assignment",
      );
    },
  },
  {
    name: "No justified envy",
    scope:
      "Checks every preferred applicant–program pair in the baseline fixture; strict common priorities.",
    run() {
      ensure(
        noJustifiedEnvy(applicants, caps, match(applicants, caps)),
        "Blocking pair found",
      );
    },
  },
  {
    name: "Displacement state consistency",
    scope:
      "A late rank-1 applicant displaces rank 2 after trying a zero-capacity choice.",
    run() {
      const ss = [
          { id: "high", rank: 1, preferences: ["closed", "P"] },
          { id: "low", rank: 2, preferences: ["P"] },
        ],
        r = match(ss, { closed: 0, P: 1 });
      ensure(
        r.matches.high === "P" &&
          r.matches.low === null &&
          r.allocations.P.join() === "high",
        "Assignment states disagree",
      );
    },
  },
  {
    name: "Freeze retention & vacancy propagation",
    scope:
      "The same withdrawal upgrades B and C under Float; Freeze retains B’s held seat.",
    run() {
      const f = scenario(),
        z = scenario({ action: "FREEZE" });
      ensure(
        f.second.matches.B === "P1" &&
          f.second.matches.C === "P2" &&
          z.second.matches.B === z.first.matches.B &&
          z.second.matches.C === "P3",
        "Round action violated",
      );
    },
  },
  {
    name: "Merit-first OPEN & category fallback",
    scope:
      "One program, one OPEN seat and one OBC seat; two hand-solved rank orders.",
    run() {
      const ss = [
          { id: "A", rank: 1, category: "OBC" },
          { id: "B", rank: 2, category: "OPEN" },
          { id: "C", rank: 3, category: "OBC" },
        ],
        r = quotaChoice(ss, 1, { OBC: 1 }),
        fallback = quotaChoice(
          [
            { id: "G", rank: 1, category: "OPEN" },
            ...ss.map((s) => ({ ...s, rank: s.rank + 1 })),
          ],
          1,
          { OBC: 1 },
        );
      ensure(
        r.OPEN[0] === "A" &&
          r.OBC[0] === "C" &&
          fallback.OPEN[0] === "G" &&
          fallback.OBC[0] === "A",
        "Quota choice mismatch",
      );
    },
  },
];
export function runFixtures() {
  return fixtures.map((f) => {
    try {
      f.run();
      return { name: f.name, scope: f.scope, passed: true };
    } catch (error) {
      return {
        name: f.name,
        scope: f.scope,
        passed: false,
        error: error.message,
      };
    }
  });
}
