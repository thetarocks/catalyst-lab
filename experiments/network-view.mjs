const fmt = (x) =>
  Number(x).toLocaleString("en-US", { maximumFractionDigits: 2 });
export function networkView({ network, raw }) {
  const { L, defaults } = network,
    n = L.length,
    xy = Array.from({ length: n }, (_, i) => [
      310 + 135 * Math.cos((i * Math.PI * 2) / n - Math.PI / 2),
      180 + 135 * Math.sin((i * Math.PI * 2) / n - Math.PI / 2),
    ]);
  return `<figure class="chart network interactive-network"><div class="chart-heading"><span class="plot-number">NETWORK / 08 BANKS</span><span class="plot-kind">SELECT A BANK</span></div><h3>Follow the obligations.</h3><svg viewBox="0 0 620 360" role="img" aria-label="Eight-bank network. Arrows point from borrower to creditor. Orange nodes pay less than promised."><defs><marker id="bank-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#8d9e89"/></marker></defs>${L.map(
    (row, i) =>
      row
        .map((v, j) => {
          if (!v) return "";
          const [x, y] = xy[i],
            [a, b] = xy[j],
            dx = a - x,
            dy = b - y,
            len = Math.hypot(dx, dy);
          return `<line data-from="${i}" data-to="${j}" x1="${x + (dx / len) * 25}" y1="${y + (dy / len) * 25}" x2="${a - (dx / len) * 28}" y2="${b - (dy / len) * 28}" stroke="#8d9e89" opacity=".42" stroke-width="${Math.min(3, 1 + v / 200)}" marker-end="url(#bank-arrow)"><title>Bank ${i + 1} owes Bank ${j + 1}: ${fmt(v)} units</title></line>`;
        })
        .join(""),
  ).join(
    "",
  )}${xy.map(([x, y], i) => `<g data-bank-node="${i}"><circle cx="${x}" cy="${y}" r="24" fill="${defaults[i] ? "#b05232" : "#285b42"}"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="#fffdf7" font-size="14">${i + 1}</text></g>`).join("")}</svg><div class="bank-selector" role="group" aria-label="Inspect bank obligations">${xy.map((_, i) => `<button type="button" data-bank="${i}" aria-pressed="${i === 0}">Bank ${i + 1}</button>`).join("")}</div><p class="bank-readout" role="status"></p><figcaption class="small">Arrows: borrower → creditor. Orange nodes: less than full payment. Green nodes: paid in full. Highlighted orange arrows are outgoing; green arrows are incoming. Outside claims are included in clearing and omitted from the drawing.</figcaption><details><summary>Inspect interbank liabilities</summary><div class="chart-data"><table><thead><tr><th>Borrower → creditor</th><th>Units owed</th></tr></thead><tbody>${L.map((row, i) => row.map((v, j) => (v ? `<tr><th scope="row">Bank ${i + 1} → Bank ${j + 1}</th><td>${fmt(v)}</td></tr>` : "")).join("")).join("")}</tbody></table></div></details></figure>`;
}
export function mountNetwork(root, r) {
  const figure = root.querySelector(".interactive-network");
  if (!figure) return;
  function select(i) {
    figure
      .querySelectorAll("[data-bank]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.bank) === i)),
      );
    figure.querySelectorAll("[data-from]").forEach((edge) => {
      const connected =
        Number(edge.dataset.from) === i || Number(edge.dataset.to) === i;
      edge.style.opacity = connected ? ".95" : ".09";
      edge.style.stroke =
        Number(edge.dataset.from) === i ? "#b05232" : "#285b42";
    });
    figure.querySelectorAll("[data-bank-node]").forEach((node) => {
      node.style.opacity = Number(node.dataset.bankNode) === i ? "1" : ".6";
    });
    const raw = r.raw;
    figure.querySelector(".bank-readout").textContent =
      `Bank ${i + 1} pays ${fmt(raw.payments[i])} of ${fmt(raw.owed[i])} promised units (${fmt((100 * raw.payments[i]) / raw.owed[i])}%). ${raw.defaults[i] ? "It pays less than promised." : "It pays in full."} Highlighted arrows show its interbank counterparties; the total also includes society.`;
  }
  figure
    .querySelectorAll("[data-bank]")
    .forEach((b) =>
      b.addEventListener("click", () => select(Number(b.dataset.bank))),
    );
  select(0);
}
