import { scenario, programs } from "./model.mjs";
import { mountInvariantSuite } from "./suite.mjs";
const action = document.querySelector("#round-action"),
  shock = document.querySelector("#round-shock");

const smallScreen = matchMedia("(max-width:600px)");
function mobileDiagram(result) {
  const ids = Object.keys(programs),
    x = (p) => 60 + ids.indexOf(p) * 110;
  const boxes = (world, y) =>
    ids
      .map((p) => {
        const who = world.allocations[p].join(", ") || "Vacant",
          empty = who === "Vacant";
        return `<rect x="${x(p) - 47}" y="${y - 27}" width="94" height="58" rx="7" fill="${empty ? "#263e32" : "#e9efd9"}" stroke="#718567"/><g fill="${empty ? "#d1ddc3" : "#172b24"}" text-anchor="middle" font-size="12"><text x="${x(p)}" y="${y - 5}">${p} · ${programs[p].institute}</text><text x="${x(p)}" y="${y + 16}">${empty ? "Vacant" : "Applicant " + who}</text></g>`;
      })
      .join("");
  const paths = ["A", "B", "C"]
    .filter((id) => result.second.matches[id])
    .map(
      (id) =>
        `<path class="chain-path" d="M${x(result.first.matches[id])} 108 C${x(result.first.matches[id])} 155 ${x(result.second.matches[id])} 178 ${x(result.second.matches[id])} 232" fill="none" stroke="${id === "B" ? "#d7ff3f" : id === "C" ? "#72cbb1" : "#8f9f83"}" stroke-width="${id === "B" ? 3 : 2}"/>`,
    )
    .join("");
  return `<title>Round one above round two under ${result.action}; lines follow applicants</title><g font-family="Arial,sans-serif">${paths}<text x="13" y="20" fill="#c7d5b9" font-size="11">ROUND 1 / TENTATIVE SEATS</text>${boxes(result.first, 77)}${boxes(result.second, 259)}<text x="13" y="321" fill="#c7d5b9" font-size="11">ROUND 2 / ${result.action}</text></g>`;
}

function diagram(result) {
  const ids = Object.keys(programs),
    y = (p) => 72 + ids.indexOf(p) * 92;
  const occupant = (world, p) => world.allocations[p].join(", ") || "Vacant";
  const boxes = (world, x) =>
    ids
      .map(
        (p) =>
          `<rect x="${x}" y="${y(p) - 28}" width="234" height="58" rx="9" fill="${occupant(world, p) === "Vacant" ? "#263e32" : "#e9efd9"}" stroke="#718567"/><text x="${x + 15}" y="${y(p) - 4}" fill="${occupant(world, p) === "Vacant" ? "#d1ddc3" : "#172b24"}" font-size="14">${p} · ${programs[p].institute}</text><text x="${x + 15}" y="${y(p) + 17}" fill="${occupant(world, p) === "Vacant" ? "#d1ddc3" : "#172b24"}" font-size="15">${occupant(world, p) === "Vacant" ? "Vacant seat" : "Applicant " + occupant(world, p)}</text>`,
      )
      .join("");
  const lines = ["A", "B", "C"]
    .filter((id) => result.second.matches[id])
    .map((id) => {
      const from = y(result.first.matches[id]),
        to = y(result.second.matches[id]);
      return `<path class="chain-path" d="M266 ${from} C360 ${from} 455 ${to} 549 ${to}" fill="none" stroke="${id === "B" ? "#d7ff3f" : id === "C" ? "#72cbb1" : "#8f9f83"}" stroke-width="${id === "B" ? 4 : 2}"/>`;
    })
    .join("");
  return `<title>Round one and round two seat assignments under ${result.action}</title><g font-family="Arial,sans-serif"><text x="32" y="20" fill="#c7d5b9" font-size="12">ROUND 1 / TENTATIVE SEATS</text><text x="552" y="20" fill="#c7d5b9" font-size="12">ROUND 2 / ${result.action}</text>${lines}${boxes(result.first, 32)}${boxes(result.second, 552)}</g>`;
}
function draw() {
  const result = scenario({
      action: action.value,
      withdrawal: shock.value === "WITHDRAW",
    }),
    counter = scenario({ withdrawal: result.withdrawal });
  const chart = document.querySelector("#vacancy-chain");
  chart.setAttribute(
    "viewBox",
    smallScreen.matches ? "0 0 340 335" : "0 0 820 296",
  );
  chart.innerHTML = smallScreen.matches
    ? mobileDiagram(result)
    : diagram(result);
  document.querySelector("#held-seat").textContent = result.first.matches.B;
  document.querySelector("#next-seat").textContent = result.second.matches.B;
  document.querySelector("#float-seat").textContent = counter.second.matches.B;
  document.querySelector("#chain-caption").textContent = !result.withdrawal
    ? "No one withdraws: every applicant keeps the same seat."
    : result.action === "FLOAT"
      ? "A withdraws. B moves from P2 to first-choice P1; C follows from P3 to P2. One vacancy creates two upgrades."
      : result.action === "FREEZE"
        ? "A withdraws, but B froze P2. B keeps P2, C keeps P3, and P1 stays vacant. The Float comparison uses the same withdrawal."
        : "A withdraws, but Slide limits B to the South institute. B keeps P2 and cannot take North’s P1; C keeps P3.";
  document.querySelector("#preset-status").textContent =
    `${result.action} · ${result.withdrawal ? "A withdraws" : "no withdrawal"} · synthetic three-applicant fixture`;
  document
    .querySelectorAll("[data-preset]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(
          b.dataset.action === action.value && b.dataset.shock === shock.value,
        ),
      ),
    );
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
    document
      .querySelectorAll(".chain-path")
      .forEach((path) =>
        path.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 350 }),
      );
}
for (const input of [action, shock]) input.addEventListener("change", draw);
document.querySelectorAll("[data-preset]").forEach((button) =>
  button.addEventListener("click", () => {
    action.value = button.dataset.action;
    shock.value = button.dataset.shock;
    draw();
  }),
);
smallScreen.addEventListener("change", draw);
mountInvariantSuite(document.querySelector(".invariant-suite"));
draw();
