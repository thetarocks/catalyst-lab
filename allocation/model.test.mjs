import test from "node:test";
import assert from "node:assert/strict";
import { fixtures } from "./fixtures.mjs";
import {
  scenario,
  applicants,
  match,
  feasibility,
  individuallyRational,
  noJustifiedEnvy,
} from "./model.mjs";
for (const f of fixtures) test(f.name, () => f.run());
test("No withdrawal and cross-institute Slide do not invent upgrades", () => {
  assert.equal(scenario({ withdrawal: false }).second.matches.B, "P2");
  assert.equal(scenario({ action: "SLIDE" }).second.matches.B, "P2");
  assert.throws(() => scenario({ action: "INVALID" }));
});
test("Property checkers detect corrupted assignments and blocking pairs", () => {
  const caps = { P1: 1, P2: 1, P3: 1 },
    r = match(applicants, caps);
  assert.equal(
    feasibility(applicants, caps, { ...r, allocations: { P1: ["A", "B"] } }),
    false,
  );
  assert.equal(
    individuallyRational(applicants, {
      ...r,
      matches: { ...r.matches, C: "P1" },
    }),
    false,
  );
  assert.equal(
    noJustifiedEnvy(applicants, caps, {
      allocations: { P1: ["B"], P2: [], P3: ["C"] },
      matches: { A: null, B: "P1", C: "P3" },
    }),
    false,
  );
});
