import { orderbook } from "./lab-models.mjs";

// The index preview uses the same matching kernel as the full experiment.
export function mountQuickPreview(container) {
  container.innerHTML = `<div class="preview-top"><span class="live-dot" aria-hidden="true"></span><span class="section-label">Live trading preview</span><span class="preview-badge">TRY IT</span></div><h2>A quote is only the beginning.</h2><p class="preview-intro">Drag the order size. See how a larger trade consumes the available depth.</p><div class="side-toggle" role="group" aria-label="Preview order side"><button type="button" data-side="1" aria-pressed="true">Buy</button><button type="button" data-side="0" aria-pressed="false">Sell</button></div><label class="preview-label" for="quick-size">Market order <output id="quick-size-label" for="quick-size"></output></label><input type="range" id="quick-size" min="50" max="4000" step="50" value="1200"><div class="preview-plot" id="quick-plot"></div><div class="preview-metrics" aria-live="polite" aria-atomic="true"><div><span>Average price</span><strong id="quick-vwap"></strong></div><div><span>Cost vs midpoint</span><strong id="quick-cost"></strong></div></div><p class="preview-fill" id="quick-fill"></p><a class="preview-link" id="quick-open" href="#orderbook">Open the full matching engine →</a><p class="preview-footnote">Synthetic book · $100 midpoint · fixed seed 42</p>`;
  const size = container.querySelector("#quick-size");
  let side = 1;
  function update() {
    const params = {
        size: Number(size.value),
        depth: 120,
        spread: 0.2,
        side,
        seed: 42,
      },
      result = orderbook(params),
      fills = result.raw.fills;
    container.querySelector("#quick-size-label").textContent =
      `${params.size.toLocaleString("en-US")} shares`;
    container.querySelector("#quick-vwap").textContent =
      `$${result.metrics[2].value.toFixed(3)}`;
    container.querySelector("#quick-cost").textContent =
      `${result.metrics[3].value.toFixed(1)} bps`;
    container.querySelector("#quick-fill").textContent = result.raw.remaining
      ? `${result.raw.filled.toLocaleString()} shares filled; ${result.raw.remaining.toLocaleString()} could not execute.`
      : `All ${params.size.toLocaleString()} shares filled across ${fills.length} price level${fills.length === 1 ? "" : "s"}.`;
    container.querySelector("#quick-open").href =
      `https://lab.yourcatalyst.in/experiments/#orderbook?${new URLSearchParams(params)}`;
    const prices = [100, ...fills.map((f) => f.price)],
      lo = Math.min(...prices) - 0.08,
      hi = Math.max(...prices) + 0.08,
      py = (v) => 76 - ((v - lo) / (hi - lo)) * 55,
      px = (v) => 20 + (v / params.size) * 280;
    let cumulative = 0,
      path = `M ${px(0)} ${py(fills[0].price)}`;
    fills.forEach((f, i) => {
      if (i) path += ` V ${py(f.price)}`;
      cumulative += f.qty;
      path += ` H ${px(cumulative)}`;
    });
    container.querySelector("#quick-plot").innerHTML =
      `<svg viewBox="0 0 320 100" role="img" aria-label="Execution prices as the order consumes depth. ${result.raw.filled} of ${params.size} shares fill."><line x1="20" x2="300" y1="${py(100)}" y2="${py(100)}" stroke="#b7c6b4" stroke-dasharray="4 4"/><text x="20" y="${Math.max(12, py(100) - 5)}" fill="#647065" font-size="9">$100 midpoint</text><path d="${path}" fill="none" stroke="${side ? "#286044" : "#aa543a"}" stroke-width="2.5" stroke-linejoin="round"/><text x="20" y="95" fill="#647065" font-size="9">0 shares</text><text x="300" y="95" text-anchor="end" fill="#647065" font-size="9">${params.size.toLocaleString()} requested</text></svg>`;
  }
  size.addEventListener("input", update);
  container.querySelectorAll("[data-side]").forEach((button) =>
    button.addEventListener("click", () => {
      side = Number(button.dataset.side);
      container
        .querySelectorAll("[data-side]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      update();
    }),
  );
  update();
}
