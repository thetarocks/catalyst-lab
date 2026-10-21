// Small, strict-priority teaching model. Not an official JoSAA implementation.
export const programs = {
  P1: { capacity: 1, institute: "North" },
  P2: { capacity: 1, institute: "South" },
  P3: { capacity: 1, institute: "South" },
};
export const applicants = [
  { id: "A", rank: 1, preferences: ["P1"] },
  { id: "B", rank: 2, preferences: ["P1", "P2"] },
  { id: "C", rank: 3, preferences: ["P2", "P3"] },
];
export function match(students, capacities) {
  const queue = students.map((s) => ({
      ...s,
      preferences: [...s.preferences],
      next: 0,
    })),
    pool = Object.fromEntries(Object.keys(capacities).map((p) => [p, []]));
  while (queue.length) {
    const s = queue.shift(),
      p = s.preferences[s.next++];
    if (p === undefined) continue;
    if (!(p in pool)) {
      queue.push(s);
      continue;
    }
    pool[p].push(s);
    pool[p].sort((a, b) => a.rank - b.rank);
    if (pool[p].length > capacities[p]) queue.push(pool[p].pop());
  }
  const allocations = Object.fromEntries(
    Object.entries(pool).map(([p, ss]) => [p, ss.map((s) => s.id)]),
  );
  const matches = Object.fromEntries(
    students.map((s) => [
      s.id,
      Object.keys(pool).find((p) => pool[p].some((x) => x.id === s.id)) ?? null,
    ]),
  );
  return { allocations, matches };
}
export function scenario({ action = "FLOAT", withdrawal = true } = {}) {
  if (!["FLOAT", "FREEZE", "SLIDE"].includes(action))
    throw Error("Unknown action");
  const capacities = Object.fromEntries(
    Object.entries(programs).map(([p, s]) => [p, s.capacity]),
  );
  const first = match(applicants, capacities),
    remaining = applicants.filter((s) => !(withdrawal && s.id === "A"));
  const locked = action === "FREEZE" ? first.matches.B : null;
  const available = { ...capacities };
  if (locked) available[locked]--;
  const cohort = remaining
    .filter((s) => !(locked && s.id === "B"))
    .map((s) => {
      const held = first.matches[s.id],
        idx = s.preferences.indexOf(held);
      let preferences = held ? s.preferences.slice(0, idx + 1) : s.preferences;
      if (s.id === "B" && action === "SLIDE")
        preferences = preferences.filter(
          (p) => programs[p].institute === programs[held].institute,
        );
      return { ...s, preferences };
    });
  const second = match(cohort, available);
  if (locked) {
    second.allocations[locked].push("B");
    second.matches.B = locked;
  }
  if (withdrawal) second.matches.A = null;
  return { action, withdrawal, first, second };
}
export function feasibility(students, capacities, result) {
  const ids = Object.values(result.allocations).flat();
  return (
    new Set(ids).size === ids.length &&
    ids.every((id) => students.some((s) => s.id === id)) &&
    Object.entries(result.allocations).every(
      ([p, ids]) => ids.length <= capacities[p],
    )
  );
}
export function individuallyRational(students, result) {
  return students.every(
    (s) =>
      result.matches[s.id] == null ||
      s.preferences.includes(result.matches[s.id]),
  );
}
export function noJustifiedEnvy(students, capacities, result) {
  return students.every((s) => {
    const held = result.matches[s.id],
      idx = held ? s.preferences.indexOf(held) : s.preferences.length;
    return s.preferences.slice(0, idx).every((p) => {
      const occupants = result.allocations[p] ?? [];
      return (
        occupants.length >= capacities[p] &&
        occupants.every((id) => students.find((x) => x.id === id).rank < s.rank)
      );
    });
  });
}
export function quotaChoice(students, openCapacity, quotas) {
  const sorted = [...students].sort((a, b) => a.rank - b.rank),
    open = sorted.slice(0, openCapacity),
    rest = sorted.slice(openCapacity);
  const reserved = Object.fromEntries(
    Object.entries(quotas).map(([cat, cap]) => [
      cat,
      rest
        .filter((s) => s.category === cat)
        .slice(0, cap)
        .map((s) => s.id),
    ]),
  );
  return { OPEN: open.map((s) => s.id), ...reserved };
}
